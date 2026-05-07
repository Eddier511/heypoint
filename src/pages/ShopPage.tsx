import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, X, ChevronDown, Grid3x3, LayoutList } from "lucide-react";
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
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { QuantitySelector } from "../components/QuantitySelector";
import { AddToCartButton } from "../components/AddToCartButton";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";
import { SaleChip } from "../components/SaleChip";
import { StockIndicator } from "../components/StockIndicator";
import { PriceDisplay } from "../components/PriceDisplay";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { api } from "../lib/api";
import { useCategories } from "../hooks/useCategories";
import { useQuery } from "@tanstack/react-query";

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
}

interface ShopPageProps {
  onProductClick: (product: Product) => void;
  onNavigate?: (page: string) => void;
  selectedCategory?: string | null;
  onCategorySelect?: (category: string) => void;
  searchQuery?: string;
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
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiProductsResponse = ApiProduct[] | { products: ApiProduct[] };

const PRODUCT_STALE_TIME = 60_000;
const PRODUCT_CACHE_TIME = 10 * 60_000;

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
  searchQuery,
  onClearSearch,
}: ShopPageProps) {
  const itemsPerPage = 12;
  const shouldReduceMotion = useReducedMotion();
  const productsGridRef = useRef<HTMLElement>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [priceMax, setPriceMax] = useState(20000);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    selectedCategory ? [selectedCategory] : [],
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  useEffect(() => {
    if (selectedCategory) setSelectedCategories([selectedCategory]);
  }, [selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, searchQuery, isOfertasFilterActive]);

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

    const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=HeyPoint";

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
      };
    });

    const countByName = new Map<string, number>();
    for (const prod of mappedProducts) {
      countByName.set(
        prod.category,
        (countByName.get(prod.category) || 0) + 1,
      );
    }

    const mappedCategories: { name: string; count: number }[] =
      apiCats.length > 0
        ? apiCats
            .map((c) => ({
              name: c.name,
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

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
    onCategorySelect?.(category);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, priceMax]);
    setIsOfertasFilterActive(false);
    onClearSearch?.();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const priceMatch =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      const searchMatch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase());

      const ofertaMatch =
        !isOfertasFilterActive ||
        (product.originalPrice !== undefined &&
          product.originalPrice > product.price);

      return categoryMatch && priceMatch && searchMatch && ofertaMatch;
    });
  }, [
    products,
    selectedCategories,
    priceRange,
    searchQuery,
    isOfertasFilterActive,
  ]);

  const activeFiltersCount =
    selectedCategories.length +
    (priceRange[0] !== 0 || priceRange[1] !== priceMax ? 1 : 0) +
    (isOfertasFilterActive ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const handlePageChange = (newPage: number) => {
    setIsLoadingPage(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setCurrentPage(newPage);
      setIsLoadingPage(false);
    }, 600);
  };

  const productosEnOferta = useMemo(() => {
    return products
      .filter((p) => p.originalPrice !== undefined && p.originalPrice > p.price)
      .slice(0, 6);
  }, [products]);
  const shouldShowOffersSection =
    isCatalogLoading || productosEnOferta.length > 0;

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
          <h4 className="text-[#1C2335] text-base">Categoría</h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCategories.includes(category.name)}
                    onCheckedChange={() => toggleCategory(category.name)}
                  />
                  <label
                    className="text-[#2E2E2E] cursor-pointer text-sm"
                    onClick={() => toggleCategory(category.name)}
                  >
                    {category.name}
                  </label>
                </div>
                <span className="text-[#2E2E2E] text-sm">
                  ({category.count})
                </span>
              </div>
            ))}

            {categories.length === 0 && !isCatalogLoading && (
              <p className="text-[#2E2E2E] text-sm">No hay categorías</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

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

          {/* Ofertas */}
          {shouldShowOffersSection && (
            <div className="mb-4 sm:mb-10">
              {/* Section header */}
              <div className="flex items-end justify-between mb-3 sm:mb-5">
                <div>
                  <h2
                    className="text-[#1C2335]"
                    style={{
                      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                      fontWeight: 700,
                    }}
                  >
                    🔥 Ofertas destacadas para vos
                  </h2>
                  <p
                    className="text-[#4A4A4A]/60 mt-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Aprovechá estos precios exclusivos
                  </p>
                </div>
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

              {isCatalogLoading ? (
                <div className="min-h-[200px]" aria-hidden="true" />
              ) : (
                <>
                  {!isLargeViewport ? (
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                      <div className="flex gap-4 min-w-max">
                            {productosEnOferta.map((product, index) => {
                              const hasDiscount =
                                product.originalPrice !== undefined &&
                                product.originalPrice > product.price;
                              const isPriorityImage = index === 0;

                              return (
                                <div
                                  key={product.id}
                                  className="w-[280px] sm:w-[320px] flex-shrink-0"
                                >
                                  <Card
                                    className={`group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-4 min-h-[340px] transition-opacity${product.stock === 0 ? " opacity-80" : ""}`}
                                    onClick={() => onProductClick(product)}
                                  >
                                    <div className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-white">
                                      <ImageWithFallback
                                        src={product.image}
                                        alt={product.name}
                                        width={600}
                                        height={600}
                                        loading={isPriorityImage ? "eager" : "lazy"}
                                        decoding="async"
                                        fetchPriority={
                                          isPriorityImage ? "high" : "auto"
                                        }
                                        className="block w-full h-full object-contain p-2"
                                      />
                                      <div className="absolute top-3 right-3">
                                        <SaleChip variant="orange" size="lg" />
                                      </div>
                                    </div>

                                    <div className="flex-1 flex flex-col pt-2">
                                <h3
                                  className="text-[#1C2335] mb-3 line-clamp-2"
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    minHeight: "2.5rem",
                                    lineHeight: "1.25",
                                  }}
                                >
                                  {product.name}
                                </h3>

                                <div className="flex-1"></div>

                                <div className="mb-2">
                                  <PriceDisplay
                                    price={product.price}
                                    originalPrice={product.originalPrice}
                                    size="md"
                                    showSaleChip={false}
                                  />
                                  {hasDiscount && (
                                    <span
                                      className="text-[#2E2E2E] block mt-1"
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ¡Ahorrás{" "}
                                      {formatPrecioARS(
                                        getPrecioFinalConIVA(
                                          product.originalPrice!,
                                        ) - getPrecioFinalConIVA(product.price),
                                      )}
                                      !
                                    </span>
                                  )}
                                </div>

                                <div className="mb-2 min-h-[14px]">
                                  <StockIndicator
                                    stock={product.stock}
                                    variant="card"
                                  />
                                </div>
                              </div>

                                    <div
                                      className="flex flex-col gap-2 flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <QuantitySelector
                                        quantity={getQuantity(product.id)}
                                        onQuantityChange={(newQ) =>
                                          updateQuantity(product.id, newQ)
                                        }
                                        max={product.stock}
                                      />
                                      <AddToCartButton
                                        productId={product.backendId}
                                        productName={product.name}
                                        productImage={product.image}
                                        productPrice={product.price}
                                        quantity={getQuantity(product.id)}
                                        variant="compact"
                                        disabled={product.stock === 0}
                                        stock={product.stock}
                                      />
                                    </div>
                                  </Card>
                                </div>
                              );
                            })}
                          </div>
                    </div>
                  ) : (
                    <div
                      className="grid gap-6"
                      style={{
                        gridTemplateColumns:
                          productosEnOferta.length >= 3
                            ? "repeat(3, 1fr)"
                            : `repeat(${productosEnOferta.length}, minmax(0, 420px))`,
                      }}
                    >
                    {productosEnOferta.map((product, index) => {
                      const hasDiscount =
                        product.originalPrice !== undefined &&
                        product.originalPrice > product.price;
                      const isPriorityImage = index === 0;

                      return (
                        <div
                          key={product.id}
                        >
                          <Card
                            className={`group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-4 transition-opacity${product.stock === 0 ? " opacity-80" : ""}`}
                            onClick={() => onProductClick(product)}
                          >
                            <div className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-white">
                              <ImageWithFallback
                                src={product.image}
                                alt={product.name}
                                width={600}
                                height={600}
                                loading={isPriorityImage ? "eager" : "lazy"}
                                decoding="async"
                                fetchPriority={
                                  isPriorityImage ? "high" : "auto"
                                }
                                className="block w-full h-full object-contain p-2"
                              />
                              <div className="absolute top-3 right-3">
                                <SaleChip variant="orange" size="lg" />
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col pt-2">
                              <h3 className="text-[#1C2335] mb-3 line-clamp-2 text-base">
                                {product.name}
                              </h3>

                              <div className="flex-1"></div>

                              <div className="mb-2">
                                <PriceDisplay
                                  price={product.price}
                                  originalPrice={product.originalPrice}
                                  size="lg"
                                  showSaleChip={false}
                                />
                                {hasDiscount && (
                                  <span className="text-[#2E2E2E] block mt-1 text-xs">
                                    ¡Ahorrás{" "}
                                    {formatPrecioARS(
                                      getPrecioFinalConIVA(
                                        product.originalPrice!,
                                      ) - getPrecioFinalConIVA(product.price),
                                    )}
                                    !
                                  </span>
                                )}
                              </div>

                              <div className="mb-2 min-h-[14px]">
                                <StockIndicator
                                  stock={product.stock}
                                  variant="card"
                                />
                              </div>
                            </div>

                            <div
                              className="flex flex-col gap-2 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <QuantitySelector
                                quantity={getQuantity(product.id)}
                                onQuantityChange={(newQ) =>
                                  updateQuantity(product.id, newQ)
                                }
                                max={product.stock}
                              />
                              <AddToCartButton
                                productId={product.backendId}
                                productName={product.name}
                                productImage={product.image}
                                productPrice={product.price}
                                quantity={getQuantity(product.id)}
                                variant="compact"
                                disabled={product.stock === 0}
                                stock={product.stock}
                              />
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                      )}
                    </>
                  )}

            </div>
          )}

          {/* Sentinel for sticky shadow detection (mobile only) */}
          <div ref={filterBarSentinelRef} className="xl:hidden h-px -mt-px" aria-hidden="true" />

          {/* Mobile Filter + Grid Toggle */}
          <div className={`xl:hidden sticky top-16 z-30 -mx-4 px-4 py-3 mb-4 bg-[#FFF4E6] flex gap-3 transition-shadow${isFilterBarStuck ? " shadow-md" : ""}`}>
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex-1 sm:flex-initial sm:w-auto bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-sm"
              style={{ fontSize: "0.938rem", fontWeight: 700 }}
            >
              <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
              Filtrar productos
              {categories.length > 0 && activeFiltersCount === 0 && (
                <span className="ml-1.5 text-[#FF6B00]/70" style={{ fontWeight: 500 }}>
                  ({categories.length})
                </span>
              )}
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setIsMobileGridCompact(!isMobileGridCompact)}
              className="sm:hidden bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-sm px-4"
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
              <Card className="p-6 bg-white border-none shadow-md rounded-2xl sticky top-24">
                <FilterPanel />
              </Card>
            </aside>

            <main ref={productsGridRef} className="flex-1 min-w-0">
              <p className="text-[#4A4A4A]/50 mb-3 text-center xl:text-left" style={{ fontSize: "0.813rem" }}>
                Comprá online y retirá en tu punto de forma rápida
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-[#2E2E2E]" style={{ fontSize: "0.938rem" }}>
                  {isCatalogLoading ? (
                    "Cargando productos..."
                  ) : (
                    <>
                      Mostrando {filteredProducts.length} de {products.length}{" "}
                      productos
                    </>
                  )}
                </p>

                <Select defaultValue="name">
                  <SelectTrigger className="w-full sm:w-48 border-gray-200 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="price-low">
                      Precio: Menor a mayor
                    </SelectItem>
                    <SelectItem value="price-high">
                      Precio: Mayor a menor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`grid ${
                  isMobileGridCompact ? "grid-cols-2" : "grid-cols-1"
                } sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6`}
              >
                {isCatalogLoading || isLoadingPage
                  ? Array.from({ length: itemsPerPage }).map((_, index) => (
                      <ProductCardSkeleton key={`skeleton-${index}`} />
                    ))
                  : filteredProducts
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((product, index) => {
                        const hasDiscount =
                          product.originalPrice !== undefined &&
                          product.originalPrice > product.price;
                        const isPriorityImage =
                          currentPage === 1 &&
                          productosEnOferta.length === 0 &&
                          index === 0;

                        return (
                          <div
                            key={product.id}
                          >
                            <Card
                              className={`group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-4 h-full min-h-[360px] transition-opacity${product.stock === 0 ? " opacity-80" : ""}`}
                              onClick={() => onProductClick(product)}
                            >
                              <div className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-white">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  width={600}
                                  height={600}
                                  loading={isPriorityImage ? "eager" : "lazy"}
                                  decoding="async"
                                  fetchPriority={
                                    isPriorityImage ? "high" : "auto"
                                  }
                                  className="block w-full h-full object-contain p-2"
                                />
                                {product.badges?.length ? (
                                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                    {product.badges.map((badge, index) =>
                                      badge === "Sale" ? (
                                        <SaleChip
                                          key={index}
                                          variant="orange"
                                          size="md"
                                        />
                                      ) : (
                                        <Badge
                                          key={index}
                                          className="bg-[#B6E322] text-white border-2 border-white px-3 py-1 shadow-md"
                                          style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                          }}
                                        >
                                          {badge}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex-1 flex flex-col pt-2">
                                <h3
                                  className="text-[#1C2335] mb-3 line-clamp-2 md:line-clamp-3"
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    minHeight: "2.5rem",
                                    lineHeight: "1.25",
                                  }}
                                >
                                  {product.name}
                                </h3>

                                <div className="flex-1"></div>

                                <div className="mb-2">
                                  <PriceDisplay
                                    price={product.price}
                                    originalPrice={product.originalPrice}
                                    size="md"
                                    showSaleChip={false}
                                  />
                                  {hasDiscount && (
                                    <span
                                      className="text-[#2E2E2E] block mt-1"
                                      style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ¡Ahorrás{" "}
                                      {formatPrecioARS(
                                        getPrecioFinalConIVA(
                                          product.originalPrice!,
                                        ) - getPrecioFinalConIVA(product.price),
                                      )}
                                      !
                                    </span>
                                  )}
                                </div>

                                <div className="mb-2 min-h-[14px]">
                                  <StockIndicator
                                    stock={product.stock}
                                    variant="card"
                                  />
                                </div>
                              </div>

                              <div
                                className="flex flex-col gap-2 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <QuantitySelector
                                  quantity={getQuantity(product.id)}
                                  onQuantityChange={(newQ) =>
                                    updateQuantity(product.id, newQ)
                                  }
                                  max={product.stock}
                                />
                                <AddToCartButton
                                  productId={product.backendId}
                                  productName={product.name}
                                  productImage={product.image}
                                  productPrice={product.price}
                                  quantity={getQuantity(product.id)}
                                  variant="compact"
                                  disabled={product.stock === 0}
                                  stock={product.stock}
                                />
                              </div>
                            </Card>
                          </div>
                        );
                      })}
              </div>

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
