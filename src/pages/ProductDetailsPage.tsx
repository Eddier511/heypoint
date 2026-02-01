import { useState, useEffect } from "react";
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
import { motion } from "motion/react";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { api } from "../lib/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: string;
  badges?: string[];
  stock: number;
}

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  onNavigate?: (page: string) => void;
  onProductClick?: (product: Product) => void;
}

export function ProductDetailsPage({
  product,
  onBack,
  onNavigate,
  onProductClick,
}: ProductDetailsPageProps) {
  const [quantity, setQuantity] = useState(1);
  const { settings } = useStoreSettings();
  const ivaPct = settings.iva ?? 21;

  // ✅ relacionados reales
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // cantidades por producto relacionado
  const [relatedQuantities, setRelatedQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [product.id]);

  // 🔥 cargar relacionados desde backend
  useEffect(() => {
    let alive = true;

    async function loadRelated() {
      try {
        setLoadingRelated(true);

        const { data } = await api.get<Product[]>("/products", {
          params: {
            category: product.category,
            exclude: product.id,
            limit: 3,
          },
        });

        if (!alive) return;
        setRelatedProducts(data);
      } catch (e) {
        console.error("Error loading related products", e);
        if (alive) setRelatedProducts([]);
      } finally {
        if (alive) setLoadingRelated(false);
      }
    }

    loadRelated();
    return () => {
      alive = false;
    };
  }, [product.id, product.category]);

  const getRelatedQty = (id: string) => relatedQuantities[id] || 1;
  const setRelatedQty = (id: string, q: number) =>
    setRelatedQuantities((p) => ({ ...p, [id]: q }));

  const handleRelatedClick = (p: Product) => {
    onProductClick?.(p);
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Mirá este producto en HeyPoint!: ${product.name} - ${formatPrecioARS(
        getPrecioFinalConIVA(product.price, ivaPct),
      )}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("¡Compartido exitosamente!");
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("¡Enlace copiado!");
    }
  };

  const totalPrice = formatPrecioARS(
    getPrecioFinalConIVA(product.price, ivaPct) * quantity,
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
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-[#1C2335]">{product.name}</span>
          </div>

          {/* Producto */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Imagen */}
            <Card className="bg-white border-none shadow-lg rounded-2xl p-6">
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <div className="absolute top-4 right-4">
                      <DiscountBadge
                        originalPrice={product.originalPrice}
                        currentPrice={product.price}
                        size="lg"
                      />
                    </div>
                  )}
              </div>
            </Card>

            {/* Info */}
            <div className="flex flex-col">
              <span className="text-[#2E2E2E] text-sm mb-2">
                {product.category}
              </span>

              <h1 className="text-[#1C2335] text-4xl font-bold mb-6">
                {product.name}
              </h1>

              <div className="mb-6">
                <span className="text-[#FF6B00] text-4xl font-bold">
                  {formatPrecioARS(getPrecioFinalConIVA(product.price, ivaPct))}
                </span>

                {product.originalPrice && (
                  <>
                    <span className="ml-3 line-through text-xl">
                      {formatPrecioARS(
                        getPrecioFinalConIVA(product.originalPrice, ivaPct),
                      )}
                    </span>
                    <Badge className="ml-2 bg-[#FF6B00]">Sale</Badge>
                  </>
                )}

                <p className="text-sm mt-2">
                  Precio sin impuestos: {formatPrecioARS(product.price)}
                </p>
              </div>

              <StockIndicator stock={product.stock} variant="detail" />

              <Card className="bg-white border-none shadow-md rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <QuantitySelector
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    max={product.stock}
                    size="large"
                  />
                  <div className="text-right">
                    <div className="text-sm">Total</div>
                    <div className="text-2xl font-bold">{totalPrice}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AddToCartButton
                    productId={product.id}
                    productName={product.name}
                    productImage={product.image}
                    productPrice={product.price}
                    quantity={quantity}
                    className="flex-1"
                    stock={product.stock}
                  />
                  <Button size="icon" variant="outline" onClick={handleShare}>
                    <Share2 />
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* 🔥 RELACIONADOS REAL */}
          <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>

          {loadingRelated && <p>Cargando productos...</p>}

          {!loadingRelated && relatedProducts.length === 0 && (
            <p>No hay productos relacionados.</p>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer p-4 hover:shadow-xl"
                onClick={() => handleRelatedClick(p)}
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3">
                  <ImageWithFallback
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2">{p.name}</h3>

                <p className="font-bold mb-2">
                  {formatPrecioARS(getPrecioFinalConIVA(p.price, ivaPct))}
                </p>

                <StockIndicator stock={p.stock} variant="card" />

                <div
                  className="mt-3 flex gap-2"
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
