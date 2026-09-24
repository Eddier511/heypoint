import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X, Search, ChevronDown, Grid3x3, LayoutList } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";
import { ProductCard } from "../components/ProductCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { formatPrecioARS } from "../utils/priceUtils";
import { api } from "../lib/api";
import { useCategories } from "../hooks/useCategories";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../contexts/CartContext";

/** =========================
 * UI Types
 * ========================= */
interface Product {
  id: number; // UI id stable (hash)
  backendId: string; // ✅ ID real del backend (string)
  categoryId?: string | null; // ✅ para relacionados
  name: string;
  image: string;
  price: number; // final SIN IVA (con descuento aplicado)
  originalPrice?: number; // base SIN IVA (si hay descuento)
  rating: number;
  category: string;
  badges?: string[];
  stock: number;
  isFeatured: boolean;
  serviceFeeExempt?: boolean;
}

interface ShopPageProps {
  onProductClick: (product: Product) => void;
  onNavigate?: (page: string) => void;
  selectedCategory?: string | null;
  onCategorySelect?: (category: string) => void;
  searchQuery?: string;
  onSearchChange: (query: string) => void;
  onClearSearch?: () => void;
}

/** =========================
 * API DTOs (REAL backend)
 * ========================= */
type ApiProduct = {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;

  basePrice: number;

  /**
   * ✅ NUEVO:
   * discountPct = porcentaje humano (0.4 = 0.4%)
   */
  discountPct?: number;

  /**
   * ⛑️ LEGACY:
   * discount (antes lo tenías como fracción 0.4 = 40%)
   * lo dejamos para no romper productos viejos
   */
  discount?: number;

  stock?: number;
  status?: "active" | "inactive";
  isFeatured?: boolean;
  serviceFeeExempt?: boolean;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiProductsResponse = ApiProduct[] | { products: ApiProduct[] };

const PRODUCT_STALE_TIME = 60_000;
const PRODUCT_CACHE_TIME = 10 * 60_000;

function normalizeSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es-AR");
}

function CatalogSearchField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">Buscar productos en la tienda</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6472]" aria-hidden="true" />
      <input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar productos"
        className="h-11 w-full rounded-full border border-[#D6D8DC] bg-white pl-10 pr-10 text-sm text-[#1C2335] outline-none placeholder:text-[#5B6472] focus-visible:border-[#FF6B00] focus-visible:ring-2 focus-visible:ring-[#FF6B00]/30"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
          className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#5B6472] hover:bg-[#FFF4E6] hover:text-[#1C2335] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function normalizeProducts(data: ApiProductsResponse): ApiProduct[] {
  return Array.isArray(data) ? data : data?.products || [];
}

// id string -> number estable
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** ✅ Convierte descuento a fracción [0..1]
 * - Si viene discountPct (0.4 = 0.4%), lo pasamos a 0.004
 * - Si no, usamos legacy discount (asumido fracción ya)
 */
function getDiscountFraction(p: ApiProduct): number {
  const pctRaw = p.discountPct;

  if (typeof pctRaw === "number" && !Number.isNaN(pctRaw) && pctRaw > 0) {
    const pct = Math.max(0, Math.min(100, pctRaw)); // clamp
    return pct / 100;
  }

  const legacy = p.discount;
  if (typeof legacy === "number" && !Number.isNaN(legacy) && legacy > 0) {
    // legacy ya era fracción (0.4 = 40%)
    return Math.max(0, Math.min(1, legacy));
  }

  return 0;
}

export function ShopPage({
  onProductClick,
  onNavigate,
  selectedCategory = null,
  onCategorySelect,
  searchQuery = "",
  onSearchChange,
  onClearSearch,
}: ShopPageProps) {
  const { cartItems } = useCart();
  const itemsPerPage = 12;
  const shouldReduceMotion = useReducedMotion();
  const productsGridRef = useRef<HTMLElement>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [priceMax, setPriceMax] = useState(20000);

  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategory);
  const [sortBy, setSortBy] = useState<"default" | "name" | "price-low" | "price-high">("default");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileGridCompact, setIsMobileGridCompact] = useState(true);
  const [isLargeViewport, setIsLargeViewport] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );

  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({});

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const pageTransitionTimeoutRef = useRef<number | null>(null);
  const [isOfertasFilterActive, setIsOfertasFilterActive] = useState(false);
  const [isFilterBarStuck, setIsFilterBarStuck] = useState(false);
  const filterBarSentinelRef = useRef<HTMLDivElement>(null);

  const {
    data: sharedCategories = [],
    isLoading: categoriesLoading,
  } = useCategories();
  const apiCats = useMemo(
    () => sharedCategories.filter((c) => c.status !== "inactive"),
    [sharedCategories],
  );

  const {
    data: apiProducts = [],
    isLoading: loading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", { status: "active" }],
    queryFn: async () => {
      const prodRaw = await api.get<ApiProductsResponse>("/products", {
        params: { status: "active" },
      });

      return normalizeProducts(prodRaw.data).filter(
        (p) => (p.status ?? "active") === "active",
      );
    },
    staleTime: PRODUCT_STALE_TIME,
    gcTime: PRODUCT_CACHE_TIME,
    refetchOnWindowFocus: false,
  });
  const error = productsError
    ? productsError instanceof Error
      ? productsError.message
      : "Error cargando productos"
    : null;
  const isCatalogLoading = loading || categoriesLoading;
  const didInitPriceRange = useRef(false);

  const getQuantity = (productId: number) => productQuantities[productId] || 1;
  const updateQuantity = (productId: number, quantity: number) => {
    setProductQuantities((prev) => ({ ...prev, [productId]: quantity }));
  };
  const getCartQuantity = (product: Product) => {
    const productId = product.backendId ?? String(product.id);
    return cartItems.find((item) => item.productId === productId)?.quantity ?? 0;
  };

  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    if (pageTransitionTimeoutRef.current !== null) {
      window.clearTimeout(pageTransitionTimeoutRef.current);
      pageTransitionTimeoutRef.current = null;
    }
    setIsLoadingPage(false);
    setCurrentPage(1);
    return () => {
      if (pageTransitionTimeoutRef.current !== null) {
        window.clearTimeout(pageTransitionTimeoutRef.current);
        pageTransitionTimeoutRef.current = null;
      }
    };
  }, [activeCategory, priceRange, searchQuery, isOfertasFilterActive, sortBy]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsLargeViewport(query.matches);

    handleChange();
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const sentinel = filterBarSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFilterBarStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-65px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const catalog = useMemo(() => {
    const catIdToName = new Map<string, string>();
    for (const c of apiCats) catIdToName.set(c.id, c.name);

    const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=Hey!Point";

    const mappedProducts: Product[] = apiProducts.map((p) => {
      const base = Number(p.basePrice || 0);

      const discountFraction = getDiscountFraction(p);
      const hasDiscount = discountFraction > 0;

      // ✅ precios SIN IVA
      const finalPrice = hasDiscount ? base * (1 - discountFraction) : base;
      const originalPrice = hasDiscount ? base : undefined;

      const img =
        (p.images && p.images.length > 0 ? p.images[0] : "") ||
        PLACEHOLDER_IMG;

      const categoryName =
        (p.categoryId ? catIdToName.get(p.categoryId) : undefined) ||
        "Uncategorized";

      return {
        id: hashId(p.id),
        backendId: String(p.id), // ✅ REAL
        categoryId: p.categoryId ?? null, // ✅ REAL
        name: p.name,
        image: img,
        price: Number(finalPrice.toFixed(2)),
        originalPrice:
          originalPrice !== undefined
            ? Number(originalPrice.toFixed(2))
            : undefined,
        rating: 4.7,
        category: categoryName,
        badges: hasDiscount ? ["Sale"] : undefined,
        stock: typeof p.stock === "number" ? p.stock : 0,
        isFeatured: Boolean(p.isFeatured ?? false),
        serviceFeeExempt: p.serviceFeeExempt === true,
      };
    });

    const countByName = new Map<string, number>();
    for (const prod of mappedProducts) {
      countByName.set(
        prod.category,
        (countByName.get(prod.category) || 0) + 1,
      );
    }

    const mappedCategories: { name: string; count: number; image?: string }[] =
      apiCats.length > 0
        ? apiCats
            .map((c) => ({
              name: c.name,
              image: c.imageUrl || c.image || undefined,
              count:
                typeof c.productCount === "number"
                  ? c.productCount
                  : countByName.get(c.name) || 0,
            }))
            .filter((c) => c.count > 0)
        : Array.from(countByName.entries()).map(([name, count]) => ({
            name,
            count,
          }));

    const maxPriceFromProducts =
      mappedProducts.length > 0
        ? Math.max(...mappedProducts.map((x) => x.price || 0))
        : 20000;

    const roundedMax = Math.max(
      20000,
      Math.ceil(maxPriceFromProducts / 500) * 500,
    );

    return {
      products: mappedProducts,
      categories: mappedCategories,
      priceMax: roundedMax,
    };
  }, [apiProducts, apiCats]);
  const { products, categories } = catalog;

  useEffect(() => {
    if (isCatalogLoading) return;

    setPriceMax(catalog.priceMax);
    if (!didInitPriceRange.current) {
      didInitPriceRange.current = true;
      setPriceRange(([min, max]) => {
        const newMax =
          max === 20000 ? catalog.priceMax : Math.min(max, catalog.priceMax);
        return [min, newMax];
      });
    }
  }, [catalog.priceMax, isCatalogLoading]);

  const clearAllFilters = () => {
    setActiveCategory(null);
    setPriceRange([0, priceMax]);
    setIsOfertasFilterActive(false);
    onClearSearch?.();
  };

  const handleSearchChange = (value: string) => {
    if (pageTransitionTimeoutRef.current !== null) {
      window.clearTimeout(pageTransitionTimeoutRef.current);
      pageTransitionTimeoutRef.current = null;
    }
    setIsLoadingPage(false);
    setCurrentPage(1);
    onSearchChange(value);
  };

  const selectCategory = (category: string | null) => {
    setActiveCategory(category);
    setIsOfertasFilterActive(false);
  };

  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const hasRefinementFilters =
    activeCategory !== null || priceRange[0] !== 0 || priceRange[1] !== priceMax || isOfertasFilterActive;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        activeCategory === null || product.category === activeCategory;

      const priceMatch =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      const searchMatch =
        !normalizedSearchQuery ||
        normalizeSearchText(product.name).includes(normalizedSearchQuery);

      const ofertaMatch =
        !isOfertasFilterActive ||
        (product.originalPrice !== undefined &&
          product.originalPrice > product.price);

      return categoryMatch && priceMatch && searchMatch && ofertaMatch;
    });
  }, [
    products,
    activeCategory,
    priceRange,
    normalizedSearchQuery,
    isOfertasFilterActive,
  ]);

  const activeFiltersCount =
    (priceRange[0] !== 0 || priceRange[1] !== priceMax ? 1 : 0) +
    (isOfertasFilterActive ? 1 : 0) +
    (normalizedSearchQuery ? 1 : 0);

  const sortedProducts = useMemo(() => {
    if (sortBy === "default") return filteredProducts;
    const sorted = [...filteredProducts];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "es-AR"));
    if (sortBy === "price-low") sorted.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [filteredProducts, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (pageTransitionTimeoutRef.current !== null) {
      window.clearTimeout(pageTransitionTimeoutRef.current);
    }
    setIsLoadingPage(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    pageTransitionTimeoutRef.current = window.setTimeout(() => {
      pageTransitionTimeoutRef.current = null;
      setCurrentPage(newPage);
      setIsLoadingPage(false);
    }, 600);
  };

  const productosEnOferta = useMemo(() => {
    return products.filter((p) => p.isFeatured === true);
  }, [products]);
  const shouldShowOffersSection =
    !isCatalogLoading && productosEnOferta.length > 0;

  const categoryNavigation = [{ name: "Todos los productos", count: products.length, image: undefined as string | undefined }, ...categories];
  const featuredShelfProducts = productosEnOferta.slice(0, 5);

  const FilterPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#1C2335] text-lg md:text-xl">
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
              {activeFiltersCount}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-[#FF6B00] hover:bg-[#FFF4E6] rounded-full text-sm"
        >
          Limpiar todo
        </Button>
      </div>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-[#1C2335] text-base">Rango de precio</h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Slider
            value={priceRange}
            onValueChange={(v) => setPriceRange(v as [number, number])}
            max={priceMax}
            step={500}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-[#2E2E2E] text-sm">
            <span>{formatPrecioARS(priceRange[0])}</span>
            <span>{formatPrecioARS(priceRange[1])}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-[#1C2335] text-base">Ofertas</h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isOfertasFilterActive}
              onCheckedChange={(checked: boolean) =>
                setIsOfertasFilterActive(Boolean(checked))
              }
            />
            <label
              className="text-[#2E2E2E] cursor-pointer text-sm"
              onClick={() => setIsOfertasFilterActive(!isOfertasFilterActive)}
            >
              Mostrar solo ofertas
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {onClose && (
        <Button
          onClick={onClose}
          className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full py-6 shadow-lg"
          style={{ fontSize: "1rem", fontWeight: 600 }}
        >
          Aplicar filtros ({filteredProducts.length} productos)
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="shop"
        onCategorySelect={onCategorySelect}
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {error && (
            <Card className="mb-6 p-4 bg-white border-none shadow-md rounded-2xl">
              <p className="text-[#1C2335]" style={{ fontWeight: 700 }}>
                No se pudo cargar el catálogo
              </p>
              <p className="text-[#2E2E2E]" style={{ fontSize: "0.938rem" }}>
                {error}
              </p>
            </Card>
          )}

          <nav aria-label="Categorías" className="xl:hidden mb-4 -mx-4 px-4 overflow-x-auto">
            <div className="flex w-max gap-2 pb-2">
              {categoryNavigation.map((category) => {
                const isActive = activeCategory === (category.name === "Todos los productos" ? null : category.name);
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => selectCategory(category.name === "Todos los productos" ? null : category.name)}
                    aria-pressed={isActive}
                    className={`min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${isActive ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-[#D6D8DC] bg-white text-[#1C2335] hover:border-[#FF6B00]"}`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="xl:hidden mb-3">
            <CatalogSearchField
              id="catalog-search-mobile"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Ofertas */}
          {shouldShowOffersSection && (
            <div className="mb-4 sm:mb-10">
              {/* Section header */}
              <div className="flex items-center justify-between mb-3 sm:mb-5">
                <h2
                  className="text-[#1C2335]"
                  style={{ fontSize: "1.125rem", fontWeight: 700 }}
                >
                  🔥 Ofertas destacadas para vos
                </h2>
                <button
                  onClick={() => {
                    setIsOfertasFilterActive(true);
                    productsGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="hidden sm:flex items-center gap-1.5 border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6] transition-colors rounded-full px-4 py-1.5 flex-shrink-0 ml-4"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}
                >
                  Ver todas las ofertas →
                </button>
              </div>

              {!isLargeViewport ? (
                <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-3 min-w-max">
                    {productosEnOferta.map((product, index) => (
                      <div
                        key={product.id}
                        className="w-[240px] sm:w-[280px] flex-shrink-0"
                      >
                        <ProductCard
                          product={product}
                          variant="featured-mobile"
                          quantity={getQuantity(product.id)}
                          onQuantityChange={(newQ) =>
                            updateQuantity(product.id, newQ)
                          }
                          onProductClick={onProductClick}
                          isPriorityImage={index === 0}
                          cartQuantity={getCartQuantity(product)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {featuredShelfProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="min-w-[210px] max-w-[280px] flex-1 flex-shrink-0"
                    >
                      <ProductCard
                        product={product}
                        variant="featured-desktop"
                        quantity={getQuantity(product.id)}
                        onQuantityChange={(newQ) =>
                          updateQuantity(product.id, newQ)
                        }
                        onProductClick={onProductClick}
                        isPriorityImage={index === 0}
                        cartQuantity={getCartQuantity(product)}
                      />
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Sentinel for sticky shadow detection (mobile only) */}
          <div ref={filterBarSentinelRef} className="xl:hidden h-px -mt-px" aria-hidden="true" />

          {/* Mobile Filter + Grid Toggle */}
          <div className={`xl:hidden sticky top-16 lg:top-20 z-30 -mx-4 px-4 py-2 mb-3 bg-[#FFF4E6] flex gap-3 transition-shadow${isFilterBarStuck ? " shadow-md" : ""}`}>
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="min-h-11 flex-1 sm:flex-initial sm:w-auto bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-sm"
              style={{ fontSize: "0.938rem", fontWeight: 700 }}
            >
              <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
              Filtrar productos
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setIsMobileGridCompact(!isMobileGridCompact)}
              className="sm:hidden min-h-11 min-w-11 bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-sm px-4"
              aria-label={
                isMobileGridCompact
                  ? "Cambiar a vista expandida"
                  : "Cambiar a vista compacta"
              }
            >
              {isMobileGridCompact ? (
                <Grid3x3 className="w-5 h-5" />
              ) : (
                <LayoutList className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex gap-8">
            <aside className="hidden xl:block w-72 flex-shrink-0">
              <Card className="p-6 bg-white border-none shadow-md rounded-2xl sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
                <nav aria-label="Categorías" className="mb-6 border-b border-gray-200 pb-5">
                  <h3 className="mb-3 text-lg font-semibold text-[#1C2335]">Categorías</h3>
                  <div className="space-y-1">
                    {categoryNavigation.map((category) => {
                      const isActive = activeCategory === (category.name === "Todos los productos" ? null : category.name);
                      return (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => selectCategory(category.name === "Todos los productos" ? null : category.name)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${isActive ? "bg-[#FFF4E6] text-[#B84B00]" : "text-[#1C2335] hover:bg-gray-50"}`}
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6] text-[#5B6472]">
                            {category.image ? (
                              <ImageWithFallback src={category.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
                            )}
                          </span>
                          <span className="truncate">{category.name}</span>
                          <span className="ml-auto shrink-0 text-xs text-[#5B6472]">{category.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                <FilterPanel />
              </Card>
            </aside>

            <main ref={productsGridRef} className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 py-1">
                {isCatalogLoading ? (
                  <div className="h-5 w-48 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
                ) : (
                  <p className="text-[#2E2E2E] text-sm" aria-live="polite">
                    Mostrando {filteredProducts.length} de {products.length}{" "}
                    productos
                  </p>
                )}

                <div className="hidden xl:block min-w-[200px] max-w-xl flex-1 ml-auto">
                  <CatalogSearchField
                    id="catalog-search-desktop"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                {isCatalogLoading ? (
                  <div className="h-10 w-40 sm:w-48 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-[shimmer_2s_ease-in-out_infinite]" />
                ) : (
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger aria-label="Ordenar productos" className="w-40 sm:w-48 border-gray-200 rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Relevancia</SelectItem>
                        <SelectItem value="name">Nombre</SelectItem>
                        <SelectItem value="price-low">
                          Precio: Menor a mayor
                        </SelectItem>
                        <SelectItem value="price-high">
                          Precio: Mayor a menor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                )}
              </div>

              <div
                className={`grid ${
                  isMobileGridCompact ? "grid-cols-2" : "grid-cols-1"
                } sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6`}
              >
                {isCatalogLoading || isLoadingPage
                  ? Array.from({ length: itemsPerPage }).map((_, index) => (
                      <ProductCardSkeleton
                        key={`skeleton-${index}`}
                        mobileLayout={isMobileGridCompact ? "grid" : "list"}
                      />
                    ))
                  : sortedProducts
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((product, index) => (
                        <div key={product.id}>
                          <ProductCard
                            product={product}
                            variant="catalog"
                            mobileLayout={isMobileGridCompact ? "grid" : "list"}
                            quantity={getQuantity(product.id)}
                            onQuantityChange={(newQ) =>
                              updateQuantity(product.id, newQ)
                            }
                            onProductClick={onProductClick}
                            isPriorityImage={
                              currentPage === 1 &&
                              productosEnOferta.length === 0 &&
                              index === 0
                            }
                            cartQuantity={getCartQuantity(product)}
                          />
                        </div>
                      ))}
              </div>

              {!isCatalogLoading && !isLoadingPage && !error && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center px-4 py-12 text-center" role="status">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#FF6B00]">
                    <Search className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="max-w-full break-words text-lg font-semibold text-[#1C2335]">
                    {normalizedSearchQuery
                      ? hasRefinementFilters
                        ? "No hay productos que coincidan con tu búsqueda y filtros"
                        : `No encontramos productos para “${searchQuery.trim()}”`
                      : hasRefinementFilters
                        ? "No hay productos con estos filtros"
                        : "Todavía no hay productos disponibles"}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-[#4B5563]">
                    {normalizedSearchQuery
                      ? "Probá con otro nombre o quitá la búsqueda para ver más productos."
                      : hasRefinementFilters
                        ? "Probá ajustando la categoría o los filtros seleccionados."
                        : "Volvé a visitar la tienda más tarde."}
                  </p>
                  {(normalizedSearchQuery || hasRefinementFilters) && (
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {normalizedSearchQuery && (
                        <Button type="button" onClick={() => handleSearchChange("")} className="rounded-full bg-[#FF6B00] px-5 text-white hover:bg-[#e56000]">
                          Limpiar búsqueda
                        </Button>
                      )}
                      {hasRefinementFilters && (
                        <Button type="button" variant="outline" onClick={clearAllFilters} className="rounded-full border-[#FF6B00] px-5 text-[#B84B00] hover:bg-white">
                          Limpiar todo
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-12">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-colors"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
                    <span
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "1rem" }}
                    >
                      Página
                    </span>
                    <Badge
                      className="bg-[#FF6B00] text-white border-none px-3 py-1"
                      style={{ fontSize: "1rem", fontWeight: 600 }}
                    >
                      {currentPage}
                    </Badge>
                    <span
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "1rem" }}
                    >
                      de {Math.ceil(filteredProducts.length / itemsPerPage)}
                    </span>
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={
                      currentPage ===
                      Math.ceil(filteredProducts.length / itemsPerPage)
                    }
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-colors"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 xl:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            <motion.div
              initial={shouldReduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 xl:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] p-6 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <Filter className="w-6 h-6 text-white" />
                  <h2
                    className="text-white"
                    style={{ fontSize: "1.5rem", fontWeight: 700 }}
                  >
                    Filtros
                  </h2>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6">
                <FilterPanel onClose={() => setIsMobileFiltersOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}

