import type { ImgHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { QuantitySelector } from "./QuantitySelector";
import { AddToCartButton } from "./AddToCartButton";
import { SaleChip } from "./SaleChip";
import { StockIndicator } from "./StockIndicator";
import { PriceDisplay } from "./PriceDisplay";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";

type ProductCardVariant = "catalog" | "featured-mobile" | "featured-desktop" | "related";

interface ProductCardProduct {
  id: string | number;
  backendId?: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  badges?: string[];
  stock: number;
}

interface ProductCardProps {
  product: ProductCardProduct;
  variant?: ProductCardVariant;
  mobileLayout?: "grid" | "list";
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onProductClick: (product: ProductCardProduct) => void;
  ivaPct?: number;
  isPriorityImage?: boolean;
  cartQuantity?: number;
}

export function ProductCard({
  product,
  variant = "catalog",
  mobileLayout = "grid",
  quantity,
  onQuantityChange,
  onProductClick,
  ivaPct,
  isPriorityImage = false,
  cartQuantity = 0,
}: ProductCardProps) {
  const hasDiscount =
    product.originalPrice !== undefined && product.originalPrice > product.price;

  const imagePriorityProps: Pick<
    ImgHTMLAttributes<HTMLImageElement>,
    "loading" | "decoding" | "fetchPriority"
  > = {
    loading: isPriorityImage ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: isPriorityImage ? "high" : "auto",
  };

  const addToCartProductId = product.backendId ?? String(product.id);
  const hasCartQuantity = cartQuantity > 0;

  if (variant === "related") {
    return (
      <Card
        className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm hover:shadow-md transition-all p-2.5"
        onClick={() => onProductClick(product)}
      >
        <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden mb-2 bg-gray-50">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <h3
          className="mb-1.5 line-clamp-2 text-[#1C2335]"
          style={{ fontSize: "0.938rem", fontWeight: 700, lineHeight: 1.25 }}
        >
          {product.name}
        </h3>

        <p className="mb-1.5 text-[#1C2335]" style={{ fontSize: "1rem", fontWeight: 800 }}>
          {formatPrecioARS(getPrecioFinalConIVA(product.price, ivaPct))}
        </p>

        <div className="mb-1.5 min-h-[18px]">
          {hasCartQuantity && (
            <div className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E6] px-2 py-0.5 text-[0.688rem] font-semibold text-[#5C3A1E]">
              <Check className="h-3 w-3 text-[#FF6B00]" />
              En el carrito · {cartQuantity}
            </div>
          )}
        </div>

        <div className="mb-2 min-h-[14px]">
          <StockIndicator stock={product.stock} variant="card" />
        </div>

        <div
          className="mt-auto flex flex-col xl:flex-row xl:items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            max={product.stock}
            size="compact"
          />
          <AddToCartButton
            productId={addToCartProductId}
            productName={product.name}
            productImage={product.image}
            productPrice={product.price}
            quantity={quantity}
            variant="compact"
            stock={product.stock}
            disabled={product.stock === 0}
          />
        </div>
      </Card>
    );
  }

  const isFeaturedMobile = variant === "featured-mobile";
  const isFeaturedDesktop = variant === "featured-desktop";
  const isCatalogListMobile = variant === "catalog" && mobileLayout === "list";
  const isCatalogGrid = variant === "catalog" && mobileLayout === "grid";
  const imageClassName = isFeaturedMobile
    ? "relative h-32 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-white"
    : isFeaturedDesktop
      ? "relative h-40 rounded-xl overflow-hidden flex-shrink-0 bg-white"
      : isCatalogListMobile
        ? "relative w-32 h-32 sm:w-auto sm:h-auto sm:aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-white"
        : "relative aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden flex-shrink-0 bg-white";
  const cardClassName = isFeaturedMobile
    ? `group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-3 min-h-[260px] transition-opacity${product.stock === 0 ? " opacity-80" : ""}`
    : isFeaturedDesktop
      ? `group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-3 h-full transition-opacity${product.stock === 0 ? " opacity-80" : ""}`
      : isCatalogListMobile
        ? `group cursor-pointer flex flex-row sm:flex-col gap-3 sm:gap-0 rounded-2xl overflow-hidden bg-white border-none shadow-sm p-3 h-full sm:min-h-[320px] transition-opacity${product.stock === 0 ? " opacity-80" : ""}`
        : `group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-sm p-3 h-full min-h-[300px] sm:min-h-[320px] transition-opacity${product.stock === 0 ? " opacity-80" : ""}`;
  const priceSize = isFeaturedDesktop ? "md" : "sm";
  const priceBlockClassName = isCatalogGrid
    ? "mb-1.5 min-h-[3.5rem]"
    : "mb-1.5";
  const controlsClassName = isCatalogGrid
    ? "mt-auto flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0"
    : "flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0";

  return (
    <Card className={cardClassName} onClick={() => onProductClick(product)}>
      <div className={imageClassName}>
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          width={600}
          height={600}
          {...imagePriorityProps}
          className="block w-full h-full object-contain p-2"
        />
        {variant === "catalog" && product.badges?.length ? (
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            {product.badges.map((badge, index) =>
              badge === "Sale" ? (
                <SaleChip key={index} variant="red" size="md" />
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
        {variant !== "catalog" && hasDiscount && (
          <div className="absolute top-3 right-3">
            <SaleChip variant="red" size="lg" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-2 min-w-0">
        {isFeaturedDesktop ? (
          <h3 className="text-[#1C2335] mb-2 line-clamp-2 text-base">
            {product.name}
          </h3>
        ) : (
          <h3
            className={`text-[#1C2335] mb-2 line-clamp-2${variant === "catalog" ? " md:line-clamp-3" : ""}`}
            style={{
              fontSize: "0.938rem",
              fontWeight: 600,
              minHeight: isCatalogListMobile ? "auto" : "2.35rem",
              lineHeight: "1.25",
            }}
          >
            {product.name}
          </h3>
        )}

        <div className={priceBlockClassName}>
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size={priceSize}
            showSaleChip={false}
          />
          {/* Reserved height — keeps all cards equal regardless of discount */}
          <div className="min-h-[1rem] mt-0.5">
            {hasDiscount && (
              <span
                className={`text-[#EF4444]${isFeaturedDesktop ? " text-xs" : ""}`}
                style={{
                  fontSize: isFeaturedDesktop ? undefined : "0.688rem",
                  fontWeight: 700,
                }}
              >
                ¡Ahorrás{" "}
                {formatPrecioARS(
                  getPrecioFinalConIVA(product.originalPrice!) -
                    getPrecioFinalConIVA(product.price),
                )}
                !
              </span>
            )}
          </div>
        </div>

        <div className="mb-1.5 min-h-[20px]">
          {hasCartQuantity && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E6] px-2.5 py-1 text-xs font-semibold text-[#5C3A1E]">
              <Check className="h-3.5 w-3.5 text-[#FF6B00]" />
              En el carrito · {cartQuantity}
            </div>
          )}
        </div>

        <div className="mb-2 min-h-[14px]">
          <StockIndicator stock={product.stock} variant="card" />
        </div>

        <div
          className={controlsClassName}
          onClick={(e) => e.stopPropagation()}
        >
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            max={product.stock}
            size="compact"
          />
          <AddToCartButton
            productId={addToCartProductId}
            productName={product.name}
            productImage={product.image}
            productPrice={product.price}
            quantity={quantity}
            variant="compact"
            disabled={product.stock === 0}
            stock={product.stock}
          />
        </div>
      </div>
    </Card>
  );
}
