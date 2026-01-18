import { useEffect, useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "motion/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";

/** =========================
 * API Helper (self-contained)
 * ========================= */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function apiGet<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** =========================
 * UI Types
 * ========================= */
interface Product {
  id: number; // UI id stable (hash from backend string id)
  name: string;
  image: string;
  price: number; // final price (con descuento aplicado)
  originalPrice?: number; // basePrice si discount > 0
  rating: number;
  category: string; // category name for filters
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
type ApiCategory = {
  id: string;
  name: string;
  productCount?: number;
  status?: "active" | "inactive";
};

type ApiProduct = {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;

  basePrice: number;
  discount?: number; // 0.3 => 30%
  stock?: number;
  status?: "active" | "inactive";

  images?: string[]; // array
  createdAt?: string;
  updatedAt?: string;
};

type ApiCategoriesResponse = ApiCategory[] | { categories: ApiCategory[] };
type ApiProductsResponse = ApiProduct[] | { products: ApiProduct[] };

function normalizeCategories(data: ApiCategoriesResponse): ApiCategory[] {
  return Array.isArray(data) ? data : data?.categories || [];
}
function normalizeProducts(data: ApiProductsResponse): ApiProduct[] {
  return Array.isArray(data) ? data : data?.products || [];
}

// id string -> number estable (para tu QuantitySelector/AddToCartButton)
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
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

  // Range defaults
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [priceMax, setPriceMax] = useState(20000);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    selectedCategory ? [selectedCategory] : [],
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileGridCompact, setIsMobileGridCompact] = useState(true);

  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({});

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isOfertasFilterActive, setIsOfertasFilterActive] = useState(false);

  // API data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug
  useEffect(() => {
    console.log("[ShopPage] searchQuery prop received:", searchQuery);
  }, [searchQuery]);

  // Quantity helpers
  const getQuantity = (productId: number) => productQuantities[productId] || 1;
  const updateQuantity = (productId: number, quantity: number) => {
    setProductQuantities((prev) => ({ ...prev, [productId]: quantity }));
  };

  // Sync selectedCategories with prop
  useEffect(() => {
    if (selectedCategory) setSelectedCategories([selectedCategory]);
  }, [selectedCategory]);

  // Reset pagination on filters/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, searchQuery, isOfertasFilterActive]);

  // Load catalog
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Traemos ambos; si categories falla, igual mostramos productos
        const [catRaw, prodRaw] = await Promise.allSettled([
          apiGet<ApiCategoriesResponse>("/categories"),
          apiGet<ApiProductsResponse>("/products"),
        ]);

        const apiCats =
          catRaw.status === "fulfilled"
            ? normalizeCategories(catRaw.value).filter(
                (c) => c.status !== "inactive",
              )
            : [];

        if (prodRaw.status !== "fulfilled") {
          throw prodRaw.reason;
        }

        const apiProds = normalizeProducts(prodRaw.value).filter((p) =>
          p.status !== "inactive" && p.status !== undefined
            ? p.status === "active"
            : true,
        );

        // category map
        const catIdToName = new Map<string, string>();
        for (const c of apiCats) catIdToName.set(c.id, c.name);

        const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=HeyPoint";

        const mappedProducts: Product[] = apiProds.map((p) => {
          const base = Number(p.basePrice || 0);
          const discount = typeof p.discount === "number" ? p.discount : 0;

          const hasDiscount = discount > 0;
          const finalPrice = hasDiscount ? base * (1 - discount) : base;
          const originalPrice = hasDiscount ? base : undefined;

          const img =
            (p.images && p.images.length > 0 ? p.images[0] : "") ||
            PLACEHOLDER_IMG;

          const categoryName =
            (p.categoryId ? catIdToName.get(p.categoryId) : undefined) ||
            "Uncategorized";

          return {
            id: hashId(p.id),
            name: p.name,
            image: img,
            price: finalPrice,
            originalPrice,
            rating: 4.7,
            category: categoryName,
            badges: hasDiscount ? ["Sale"] : undefined,
            stock: typeof p.stock === "number" ? p.stock : 0,
          };
        });

        // categories for sidebar
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

        // Price max
        const maxPriceFromProducts =
          mappedProducts.length > 0
            ? Math.max(...mappedProducts.map((x) => x.price || 0))
            : 20000;

        const roundedMax = Math.max(
          20000,
          Math.ceil(maxPriceFromProducts / 500) * 500,
        );

        if (!mounted) return;

        setProducts(mappedProducts);
        setCategories(mappedCategories);
        setPriceMax(roundedMax);
        setPriceRange(([min, max]) => {
          const newMax = max === 20000 ? roundedMax : Math.min(max, roundedMax);
          return [min, newMax];
        });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Error cargando productos");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
        (product.originalPrice && product.originalPrice > product.price);

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
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .slice(0, 6);
  }, [products]);

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

            {categories.length === 0 && !loading && (
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
          <div className="mb-8 sm:mb-12">
            <h1
              className="text-[#1C2335] mb-2"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700 }}
            >
              Tienda
            </h1>
            <p
              className="text-[#2E2E2E]"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)" }}
            >
              Productos frescos y de calidad directo a tu puerta
            </p>

            {error && (
              <Card className="mt-4 p-4 bg-white border-none shadow-md rounded-2xl">
                <p className="text-[#1C2335]" style={{ fontWeight: 700 }}>
                  No se pudo cargar el catálogo
                </p>
                <p className="text-[#2E2E2E]" style={{ fontSize: "0.938rem" }}>
                  {error}
                </p>
              </Card>
            )}
          </div>

          {/* Ofertas */}
          {productosEnOferta.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <Card className="bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF4E6] border-2 border-[#FF6B00]/20 shadow-lg rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8534] p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">🔥</span>
                      </div>
                      <div>
                        <h2
                          className="text-white"
                          style={{
                            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                            fontWeight: 700,
                          }}
                        >
                          Ofertas destacadas para vos
                        </h2>
                        <p
                          className="text-white/90"
                          style={{ fontSize: "clamp(0.875rem, 2vw, 1rem)" }}
                        >
                          Aprovechá estos precios exclusivos
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setIsOfertasFilterActive(true)}
                      variant="ghost"
                      className="hidden sm:flex bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full px-4 py-2"
                      style={{ fontSize: "0.938rem", fontWeight: 600 }}
                    >
                      Ver todas
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Mobile scroll */}
                  <div className="lg:hidden overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                    <div className="flex gap-4 min-w-max">
                      {productosEnOferta.map((product) => {
                        const hasDiscount =
                          product.originalPrice &&
                          product.originalPrice > product.price;

                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="w-[280px] sm:w-[320px] flex-shrink-0"
                          >
                            <Card
                              className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                              onClick={() => onProductClick(product)}
                            >
                              <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3">
                                  <SaleChip variant="orange" size="lg" />
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col pt-3">
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

                                <div className="mb-3 min-h-[14px]">
                                  <StockIndicator
                                    stock={product.stock}
                                    variant="card"
                                  />
                                </div>
                              </div>

                              <div
                                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex justify-center sm:justify-start">
                                  <QuantitySelector
                                    quantity={getQuantity(product.id)}
                                    onQuantityChange={(newQ) =>
                                      updateQuantity(product.id, newQ)
                                    }
                                    max={product.stock}
                                  />
                                </div>
                                <AddToCartButton
                                  productId={product.id}
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
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop grid */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                    {productosEnOferta.map((product) => {
                      const hasDiscount =
                        product.originalPrice &&
                        product.originalPrice > product.price;

                      return (
                        <motion.div
                          key={product.id}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                          <Card
                            className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                            onClick={() => onProductClick(product)}
                          >
                            <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                              <ImageWithFallback
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3">
                                <SaleChip variant="orange" size="lg" />
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col pt-3">
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

                              <div className="mb-3 min-h-[14px]">
                                <StockIndicator
                                  stock={product.stock}
                                  variant="card"
                                />
                              </div>
                            </div>

                            <div
                              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0"
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
                                productId={product.id}
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
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="sm:hidden mt-4 flex justify-center">
                    <button
                      onClick={() => setIsOfertasFilterActive(true)}
                      className="text-[#FF6B00] hover:text-[#e56000] transition-colors flex items-center gap-1"
                      style={{ fontSize: "0.938rem", fontWeight: 600 }}
                    >
                      Ver todas las ofertas <span className="text-lg">→</span>
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Mobile Filter + Grid Toggle */}
          <div className="xl:hidden mb-6 flex gap-3">
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex-1 sm:flex-initial sm:w-auto bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-md"
              style={{ fontSize: "1rem", fontWeight: 600 }}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button
              onClick={() => setIsMobileGridCompact(!isMobileGridCompact)}
              className="sm:hidden bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-md px-4"
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

            <main className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-[#2E2E2E]" style={{ fontSize: "0.938rem" }}>
                  Mostrando {filteredProducts.length} de {products.length}{" "}
                  productos
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
                className={`grid ${isMobileGridCompact ? "grid-cols-2" : "grid-cols-1"} sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6`}
              >
                {loading || isLoadingPage
                  ? Array.from({ length: itemsPerPage }).map((_, index) => (
                      <ProductCardSkeleton key={`skeleton-${index}`} />
                    ))
                  : filteredProducts
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((product) => {
                        const hasDiscount =
                          product.originalPrice &&
                          product.originalPrice > product.price;

                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                          >
                            <Card
                              className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                              onClick={() => onProductClick(product)}
                            >
                              <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {product.badges &&
                                  product.badges.length > 0 && (
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
                                  )}
                              </div>

                              <div className="flex-1 flex flex-col pt-3">
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

                                <div className="mb-3 min-h-[14px]">
                                  <StockIndicator
                                    stock={product.stock}
                                    variant="card"
                                  />
                                </div>
                              </div>

                              <div
                                className="flex flex-col gap-3 items-stretch flex-shrink-0"
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
                                  productId={product.id}
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
                          </motion.div>
                        );
                      })}
              </div>

              {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-12">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-all"
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
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-all"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 xl:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
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
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
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
