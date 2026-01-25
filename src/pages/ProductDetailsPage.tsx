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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

interface Product {
  id: string; // ✅ Firestore doc id
  name: string;
  image: string;
  price: number; // basePrice (sin IVA)
  originalPrice?: number; // base original (sin IVA)
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

  // ✅ IVA dinámico
  const { settings } = useStoreSettings();
  const ivaPct = settings.iva ?? 21;

  const [relatedProductQuantities, setRelatedProductQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [product.id]);

  const getRelatedProductQuantity = (productId: string) => {
    return relatedProductQuantities[productId] || 1;
  };

  const updateRelatedProductQuantity = (productId: string, q: number) => {
    setRelatedProductQuantities((prev) => ({ ...prev, [productId]: q }));
  };

  const handleRelatedProductClick = (
    relatedProduct: (typeof recommendedProducts)[0],
  ) => {
    onProductClick?.({
      id: relatedProduct.id,
      name: relatedProduct.name,
      image: relatedProduct.image,
      price: relatedProduct.price,
      rating: relatedProduct.rating,
      category: relatedProduct.category,
      badges: [],
      stock: relatedProduct.stock,
      originalPrice: undefined,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Mirá este producto en HeyPoint!: ${product.name} - ${formatPrecioARS(getPrecioFinalConIVA(product.price, ivaPct))}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("¡Compartido exitosamente!", {
          description: "El producto fue compartido",
          duration: 2000,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError")
          console.error("Error sharing:", error);
      }
    } else {
      const textToCopy = window.location.href;
      let copySuccess = false;

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          copySuccess = true;
        } catch {
          // fallback abajo
        }
      }

      if (!copySuccess) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          copySuccess = document.execCommand("copy");
          document.body.removeChild(textArea);
        } catch (error) {
          console.error("Fallback copy method failed:", error);
        }
      }

      if (copySuccess) {
        toast.success("¡Enlace copiado!", {
          description: "El enlace del producto fue copiado al portapapeles",
          duration: 2000,
        });
      } else {
        toast.error("Error al copiar", {
          description: "No se pudo copiar el enlace automáticamente",
          duration: 3000,
        });
      }
    }
  };

  const productImages = [product.image];

  // ✅ (Mock) recomendados con id string (en real vendrán del backend)
  const recommendedProducts = [
    {
      id: "13",
      name: "Fresh Strawberries",
      image:
        "https://images.unsplash.com/photo-1710528184650-fc75ae862c13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      price: 12500.0,
      rating: 4.8,
      category: "Fruits",
      stock: 12,
    },
    {
      id: "14",
      name: "Fresh Bananas",
      image:
        "https://images.unsplash.com/photo-1757332050958-b797a022c910?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      price: 8900.0,
      rating: 4.6,
      category: "Fruits",
      stock: 4,
    },
    {
      id: "15",
      name: "Fresh Oranges",
      image:
        "https://images.unsplash.com/photo-1613370487983-4bd43a899822?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      price: 10500.0,
      rating: 4.7,
      category: "Fruits",
      stock: 8,
    },
  ] as const;

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
          <div
            className="flex items-center gap-2 mb-8 text-[#2E2E2E]"
            style={{ fontSize: "0.938rem" }}
          >
            <button
              onClick={onBack}
              className="flex items-center gap-1 hover:text-[#FF6B00] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a la tienda
            </button>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-[#1C2335]">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="flex">
              <Card className="bg-white border-none shadow-lg rounded-2xl overflow-hidden p-6 w-full flex flex-col">
                <div className="relative rounded-2xl overflow-hidden flex-1">
                  {productImages.length > 1 ? (
                    <Carousel>
                      <CarouselContent>
                        {productImages.map((img, index) => (
                          <CarouselItem key={index}>
                            <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden">
                              <ImageWithFallback
                                src={img}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </Carousel>
                  ) : (
                    <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

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
            </div>

            <div className="flex">
              <div className="flex flex-col w-full">
                <div className="mb-2">
                  <span
                    className="text-[#2E2E2E]"
                    style={{ fontSize: "0.938rem" }}
                  >
                    Orchard Fresh • {product.category}
                  </span>
                </div>

                <h1
                  className="text-[#1C2335] mb-6"
                  style={{ fontSize: "2.5rem", fontWeight: 700 }}
                >
                  {product.name}
                </h1>

                <div className="mb-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-[#FF6B00]"
                      style={{ fontSize: "2.5rem", fontWeight: 700 }}
                    >
                      {formatPrecioARS(
                        getPrecioFinalConIVA(product.price, ivaPct),
                      )}
                    </span>

                    {product.originalPrice && (
                      <>
                        <span
                          className="text-[#2E2E2E] line-through"
                          style={{ fontSize: "1.5rem" }}
                        >
                          {formatPrecioARS(
                            getPrecioFinalConIVA(product.originalPrice, ivaPct),
                          )}
                        </span>
                        <Badge
                          className="bg-[#FF6B00] text-white border-none px-3 py-1"
                          style={{ fontSize: "0.875rem", fontWeight: 600 }}
                        >
                          Sale
                        </Badge>
                      </>
                    )}
                  </div>

                  <p
                    className="text-[#2E2E2E] mt-2"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Precio sin impuestos: {formatPrecioARS(product.price)}
                  </p>
                </div>

                <div className="mb-6">
                  <StockIndicator stock={product.stock} variant="detail" />
                </div>

                <div className="flex-1" />

                <Card className="bg-white border-none shadow-md rounded-2xl p-6 mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <span
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "1rem", fontWeight: 600 }}
                      >
                        Cantidad:
                      </span>
                      <QuantitySelector
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        max={product.stock}
                        size="large"
                      />
                    </div>

                    <div className="text-left sm:text-right">
                      <div
                        className="text-[#2E2E2E] mb-1"
                        style={{ fontSize: "0.875rem" }}
                      >
                        Total:
                      </div>
                      <div
                        className="text-[#1C2335]"
                        style={{ fontSize: "1.75rem", fontWeight: 700 }}
                      >
                        {totalPrice}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <AddToCartButton
                      productId={product.id} // ✅ string
                      productName={product.name}
                      productImage={product.image}
                      productPrice={product.price} // basePrice
                      quantity={quantity}
                      className="flex-1"
                      stock={product.stock}
                    />

                    <Button
                      size="icon"
                      variant="outline"
                      className="w-14 h-14 rounded-full border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 transition-all"
                      onClick={handleShare}
                      aria-label="Compartir producto"
                    >
                      <Share2 className="w-5 h-5 text-gray-400 group-hover:text-[#FF6B00]" />
                    </Button>
                  </div>
                </Card>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                    <Truck className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                    <p
                      className="text-[#1C2335] mb-1"
                      style={{ fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      Envío gratis
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.75rem" }}
                    >
                      En pedidos +$50
                    </p>
                  </Card>
                  <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                    <Shield className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                    <p
                      className="text-[#1C2335] mb-1"
                      style={{ fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      Garantía de calidad
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.75rem" }}
                    >
                      100% fresco
                    </p>
                  </Card>
                  <Card className="bg-white border-none shadow-sm rounded-xl p-4 text-center">
                    <Clock className="w-8 h-8 text-[#FF6B00] mx-auto mb-2" />
                    <p
                      className="text-[#1C2335] mb-1"
                      style={{ fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      Envío el mismo día
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Pedidos antes 14hs
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2
              className="text-[#1C2335] mb-8"
              style={{ fontSize: "2rem", fontWeight: 700 }}
            >
              Productos relacionados
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {recommendedProducts.map((recProduct) => (
                <Card
                  key={recProduct.id}
                  className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-all p-4 h-full"
                  onClick={() => handleRelatedProductClick(recProduct)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={recProduct.image}
                      alt={recProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
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
                      {recProduct.name}
                    </h3>

                    <div className="flex-1" />

                    <div className="mb-2">
                      <span
                        className="text-[#1C2335]"
                        style={{ fontSize: "1.25rem", fontWeight: 700 }}
                      >
                        {formatPrecioARS(
                          getPrecioFinalConIVA(recProduct.price, ivaPct),
                        )}
                      </span>
                    </div>

                    <div className="mb-3 min-h-[14px]">
                      <StockIndicator stock={recProduct.stock} variant="card" />
                    </div>
                  </div>

                  <div
                    className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <QuantitySelector
                      quantity={getRelatedProductQuantity(recProduct.id)}
                      onQuantityChange={(newQuantity) =>
                        updateRelatedProductQuantity(recProduct.id, newQuantity)
                      }
                      max={recProduct.stock}
                    />
                    <AddToCartButton
                      productId={recProduct.id} // ✅ string
                      productName={recProduct.name}
                      productImage={recProduct.image}
                      productPrice={recProduct.price}
                      quantity={getRelatedProductQuantity(recProduct.id)}
                      variant="compact"
                      disabled={recProduct.stock === 0}
                      stock={recProduct.stock}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
