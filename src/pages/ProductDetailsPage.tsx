import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Share2, Truck, Shield, Clock } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { QuantitySelector } from "../components/QuantitySelector";
import { AddToCartButton } from "../components/AddToCartButton";
import { DiscountBadge } from "../components/DiscountBadge";
import { StockIndicator } from "../components/StockIndicator";
import { BackToTopButton } from "../components/BackToTopButton";
import { toast } from "sonner";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { api } from "../lib/api";

type ApiProduct = {
  id: string;
  name: string;
  sku?: string | null;
  description?: string;
  categoryId?: string | null;
  basePrice: number;
  discount?: number; // %
  discountPct?: number; // %
  stock?: number;
  status?: "active" | "inactive";
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

interface UiProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;

  categoryId?: string | null;
  categoryName?: string;

  category: string; // label visual
  badges?: string[];
  stock: number;
}

interface ProductDetailsPageProps {
  product: UiProduct; // viene “incompleto” desde la tienda, lo usamos como fallback visual
  onBack: () => void;
  onNavigate?: (page: string) => void;
  onProductClick?: (product: UiProduct) => void;
}

const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=HeyPoint";

function normalizeArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.products)) return raw.products;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.result)) return raw.result;
  return [];
}

async function fetchProductById(id: string): Promise<ApiProduct | null> {
  // baseURL ya incluye /api, así que esto pega a: /api/products/:id
  const res = await api.get<any>(`/products/${id}`);
  const data = res?.data;
  const p = data?.product ?? data?.data ?? data;
  return p ? (p as ApiProduct) : null;
}

/**
 * ✅ Mapea Product backend -> UI
 * - price = basePrice con descuento aplicado (sin IVA)
 */
function mapApiToUi(p: ApiProduct, categoryName?: string): UiProduct {
  const discountPct = Number(p.discountPct ?? p.discount ?? 0) || 0;
  const base = Number(p.basePrice ?? 0) || 0;

  const finalBase =
    discountPct > 0 ? Math.round(base * (1 - discountPct / 100)) : base;

  return {
    id: String(p.id),
    name: String(p.name ?? "Producto"),
    image: (p.images?.[0] || "").trim() || PLACEHOLDER_IMG,
    price: finalBase,
    originalPrice: discountPct > 0 ? base : undefined,
    rating: 0,

    categoryId: p.categoryId ?? null,
    categoryName,
    category: categoryName ?? "Otros",

    badges: discountPct > 0 ? ["Sale"] : [],
    stock: Number(p.stock ?? 0) || 0,
  };
}

export function ProductDetailsPage({
  product,
  onBack,
  onNavigate,
  onProductClick,
}: ProductDetailsPageProps) {
  // ✅ estado local: el prop puede venir sin categoryId, acá lo “hidratamos” desde backend
  const [currentProduct, setCurrentProduct] = useState<UiProduct>(product);

  // cuando cambia el product por props (ej. click a otro), actualizamos fallback visual
  useEffect(() => {
    setCurrentProduct(product);
  }, [product.id]);

  const [quantity, setQuantity] = useState(1);

  // ✅ IVA dinámico
  const { settings } = useStoreSettings();
  const ivaPct = settings.iva ?? 21;

  // ✅ relacionados reales
  const [relatedProducts, setRelatedProducts] = useState<UiProduct[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // ✅ cantidades por producto relacionado
  const [relatedQuantities, setRelatedQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [currentProduct.id]);

  // ✅ 1) Hidratar producto real (traer categoryId real, stock real, etc.)
  useEffect(() => {
    let alive = true;

    async function hydrate() {
      try {
        const full = await fetchProductById(currentProduct.id);
        if (!alive) return;

        if (!full) return;

        // mantenemos el label visual que ya traía (Ej: "Kiosco") como categoryName
        const label =
          currentProduct.categoryName ?? currentProduct.category ?? "Otros";
        const mapped = mapApiToUi(full, label);

        setCurrentProduct(mapped);
      } catch (e) {
        console.error("[ProductDetails] Error hydrating product", e);
      }
    }

    hydrate();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct.id]);

  // ✅ 2) Cargar relacionados por categoryId real
  useEffect(() => {
    let alive = true;

    async function loadRelated() {
      try {
        setLoadingRelated(true);

        const categoryId = String(currentProduct.categoryId ?? "");
        if (!categoryId) {
          if (alive) setRelatedProducts([]);
          return;
        }

        // Intento 1: pedir filtrado al backend
        const res = await api.get<any>("/products", {
          params: {
            categoryId,
            status: "active",
            limit: 20,
          },
        });

        const list = normalizeArray(res?.data) as ApiProduct[];

        let related = list
          .filter(Boolean)
          .filter((p) => String(p.id) !== String(currentProduct.id))
          .filter((p) => (p.status ?? "active") !== "inactive")
          .filter((p) => String(p.categoryId ?? "") === categoryId)
          .map((p) => mapApiToUi(p, currentProduct.category))
          .filter((p) => p.price > 0)
          .slice(0, 3);

        // Fallback: si backend no filtra o vienen pocos, traemos activos y completamos
        if (related.length < 3) {
          const allRes = await api.get<any>("/products", {
            params: { status: "active", limit: 60 },
          });

          const allList = normalizeArray(allRes?.data) as ApiProduct[];

          // primero intentamos completar con misma categoría
          const sameCatFill = allList
            .filter(Boolean)
            .filter((p) => String(p.id) !== String(currentProduct.id))
            .filter((p) => (p.status ?? "active") !== "inactive")
            .filter((p) => String(p.categoryId ?? "") === categoryId)
            .map((p) => mapApiToUi(p, currentProduct.category))
            .filter((p) => p.price > 0);

          const used = new Set(related.map((x) => x.id));
          for (const p of sameCatFill) {
            if (related.length >= 3) break;
            if (used.has(p.id)) continue;
            related.push(p);
            used.add(p.id);
          }

          // si aún faltan, rellenamos con “activos recientes” (cualquier categoría)
          if (related.length < 3) {
            const anyFill = allList
              .filter(Boolean)
              .filter((p) => String(p.id) !== String(currentProduct.id))
              .filter((p) => (p.status ?? "active") !== "inactive")
              .map((p) => mapApiToUi(p, currentProduct.category))
              .filter((p) => p.price > 0);

            for (const p of anyFill) {
              if (related.length >= 3) break;
              if (used.has(p.id)) continue;
              related.push(p);
              used.add(p.id);
            }
          }
        }

        if (!alive) return;
        setRelatedProducts(related);
      } catch (e) {
        console.error("[ProductDetails] Error loading related products", e);
        if (alive) setRelatedProducts([]);
      } finally {
        if (alive) setLoadingRelated(false);
      }
    }

    loadRelated();

    return () => {
      alive = false;
    };
  }, [currentProduct.id, currentProduct.categoryId, currentProduct.category]);

  const getRelatedQty = (id: string) => relatedQuantities[id] || 1;
  const setRelatedQty = (id: string, q: number) =>
    setRelatedQuantities((prev) => ({ ...prev, [id]: q }));

  const handleRelatedClick = (p: UiProduct) => {
    onProductClick?.(p);
  };

  const handleShare = async () => {
    const shareData = {
      title: currentProduct.name,
      text: `Mirá este producto en HeyPoint!: ${currentProduct.name} - ${formatPrecioARS(
        getPrecioFinalConIVA(currentProduct.price, ivaPct),
      )}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("¡Compartido exitosamente!");
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("¡Enlace copiado!");
      } catch {
        toast.error("No se pudo copiar el enlace.");
      }
    }
  };

  const totalPrice = formatPrecioARS(
    getPrecioFinalConIVA(currentProduct.price, ivaPct) * quantity,
  );

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="productDetails"
        isTransparent={false}
      />

      <BackToTopButton />

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-[#2E2E2E] text-sm">
            <button
              onClick={onBack}
              className="flex items-center gap-1 hover:text-[#FF6B00]"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la tienda
            </button>
            <span>/</span>
            <span>{currentProduct.category}</span>
            <span>/</span>
            <span className="text-[#1C2335]">{currentProduct.name}</span>
          </div>

          {/* Producto */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Imagen */}
            <Card className="bg-white border-none shadow-lg rounded-2xl p-6">
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <ImageWithFallback
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                {currentProduct.originalPrice &&
                  currentProduct.originalPrice > currentProduct.price && (
                    <div className="absolute top-4 right-4">
                      <DiscountBadge
                        originalPrice={currentProduct.originalPrice}
                        currentPrice={currentProduct.price}
                        size="lg"
                      />
                    </div>
                  )}
              </div>
            </Card>

            {/* Info */}
            <div className="flex flex-col">
              <span className="text-[#2E2E2E] text-sm mb-2">
                {currentProduct.category}
              </span>

              <h1 className="text-[#1C2335] text-4xl font-bold mb-6">
                {currentProduct.name}
              </h1>

              <div className="mb-6">
                <span className="text-[#FF6B00] text-4xl font-bold">
                  {formatPrecioARS(
                    getPrecioFinalConIVA(currentProduct.price, ivaPct),
                  )}
                </span>

                {currentProduct.originalPrice && (
                  <>
                    <span className="ml-3 line-through text-xl text-[#2E2E2E]">
                      {formatPrecioARS(
                        getPrecioFinalConIVA(
                          currentProduct.originalPrice,
                          ivaPct,
                        ),
                      )}
                    </span>
                    <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
                      Sale
                    </Badge>
                  </>
                )}

                <p className="text-sm mt-2 text-[#2E2E2E]">
                  Precio sin impuestos: {formatPrecioARS(currentProduct.price)}
                </p>
              </div>

              <StockIndicator stock={currentProduct.stock} variant="detail" />

              <Card className="bg-white border-none shadow-md rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4 gap-4">
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    max={currentProduct.stock}
                    size="large"
                  />
                  <div className="text-right">
                    <div className="text-sm text-[#2E2E2E]">Total</div>
                    <div className="text-2xl font-bold text-[#1C2335]">
                      {totalPrice}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AddToCartButton
                    productId={currentProduct.id}
                    productName={currentProduct.name}
                    productImage={currentProduct.image}
                    productPrice={currentProduct.price}
                    quantity={quantity}
                    className="flex-1"
                    stock={currentProduct.stock}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleShare}
                    aria-label="Compartir producto"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                  <Truck className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                  <p className="text-[#1C2335] text-sm font-semibold mb-1">
                    Envío gratis
                  </p>
                  <p className="text-[#2E2E2E] text-xs">En pedidos +$50</p>
                </Card>

                <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                  <Shield className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                  <p className="text-[#1C2335] text-sm font-semibold mb-1">
                    Garantía de calidad
                  </p>
                  <p className="text-[#2E2E2E] text-xs">100% fresco</p>
                </Card>

                <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                  <p className="text-[#1C2335] text-sm font-semibold mb-1">
                    Envío el mismo día
                  </p>
                  <p className="text-[#2E2E2E] text-xs">Pedidos antes 14hs</p>
                </Card>
              </div>
            </div>
          </div>

          {/* RELACIONADOS */}
          <h2 className="text-2xl font-bold mb-6 text-[#1C2335]">
            Productos relacionados
          </h2>

          {loadingRelated && (
            <p className="text-[#2E2E2E]">Cargando productos...</p>
          )}

          {!loadingRelated && relatedProducts.length === 0 && (
            <p className="text-[#2E2E2E]/70">No hay productos relacionados.</p>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {relatedProducts.slice(0, 3).map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-all p-4"
                onClick={() => handleRelatedClick(p)}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                  <ImageWithFallback
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2 text-[#1C2335]">
                  {p.name}
                </h3>

                <p className="font-bold mb-2 text-[#1C2335]">
                  {formatPrecioARS(getPrecioFinalConIVA(p.price, ivaPct))}
                </p>

                <div className="mb-3">
                  <StockIndicator stock={p.stock} variant="card" />
                </div>

                <div
                  className="mt-auto flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QuantitySelector
                    quantity={getRelatedQty(p.id)}
                    onQuantityChange={(q) => setRelatedQty(p.id, q)}
                    max={p.stock}
                  />
                  <AddToCartButton
                    productId={p.id}
                    productName={p.name}
                    productImage={p.image}
                    productPrice={p.price}
                    quantity={getRelatedQty(p.id)}
                    variant="compact"
                    stock={p.stock}
                    disabled={p.stock === 0}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
