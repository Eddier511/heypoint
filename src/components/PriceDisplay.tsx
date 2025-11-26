import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { Badge } from "./ui/badge";

interface PriceDisplayProps {
  /** Precio base del producto (sin IVA) */
  price: number;
  /** Precio original (sin IVA) si el producto está en oferta */
  originalPrice?: number;
  /** Tamaño del precio - afecta font size */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Mostrar chip de oferta si hay originalPrice */
  showSaleChip?: boolean;
  /** Alineación del precio */
  align?: "left" | "center" | "right";
  /** Clases adicionales para el container */
  className?: string;
  /** Mostrar precios en línea horizontal vs vertical */
  inline?: boolean;
}

/**
 * PriceDisplay Component
 * 
 * Componente unificado para mostrar precios en todo el sistema (Kiosko + Web).
 * 
 * Reglas de diseño:
 * - Todos los precios siempre en negro/gris oscuro (#111 / #222)
 * - NO usar naranja para precios
 * - Productos en oferta: precio final negro + precio anterior tachado gris + chip OFERTA naranja
 * - Productos regulares: solo precio negro
 * 
 * @param price - Precio base (sin IVA)
 * @param originalPrice - Precio original si está en oferta
 * @param size - Tamaño del precio (xs, sm, md, lg, xl)
 * @param showSaleChip - Mostrar chip "OFERTA" si hay originalPrice
 * @param align - Alineación (left, center, right)
 * @param className - Clases adicionales
 * @param inline - Mostrar precios en línea horizontal
 */
export function PriceDisplay({
  price,
  originalPrice,
  size = "md",
  showSaleChip = true,
  align = "left",
  className = "",
  inline = true
}: PriceDisplayProps) {
  // Calcular precio final con IVA
  const precioFinal = getPrecioFinalConIVA(price);
  const precioOriginal = originalPrice ? getPrecioFinalConIVA(originalPrice) : undefined;

  // Determinar si hay oferta
  const isOnSale = !!originalPrice && originalPrice > price;

  // Font sizes según el tamaño
  const fontSizes = {
    xs: { final: "0.813rem", original: "0.688rem" },     // 13px / 11px
    sm: { final: "0.938rem", original: "0.813rem" },     // 15px / 13px
    md: { final: "1.25rem", original: "1rem" },          // 20px / 16px
    lg: { final: "1.5rem", original: "1.125rem" },       // 24px / 18px
    xl: { final: "2rem", original: "1.5rem" }            // 32px / 24px
  };

  // Clase de alineación
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end"
  }[align];

  // Layout: inline (horizontal) o stacked (vertical)
  const layoutClass = inline ? "flex-row items-center gap-2" : "flex-col items-start gap-1";

  return (
    <div className={`flex ${layoutClass} ${alignClass} flex-wrap ${className}`}>
      {/* Precio Final - Siempre negro/gris oscuro */}
      <span
        className="text-[#111]"
        style={{
          fontSize: fontSizes[size].final,
          fontWeight: 700,
          lineHeight: 1.2
        }}
      >
        {formatPrecioARS(precioFinal)}
      </span>

      {/* Precio Original (Tachado) - Solo si está en oferta */}
      {isOnSale && precioOriginal && (
        <span
          className="text-[#999] line-through"
          style={{
            fontSize: fontSizes[size].original,
            fontWeight: 400,
            lineHeight: 1.2
          }}
        >
          {formatPrecioARS(precioOriginal)}
        </span>
      )}

      {/* Chip OFERTA - Solo si está en oferta y showSaleChip es true */}
      {isOnSale && showSaleChip && (
        <Badge
          variant="default"
          className="bg-[#FF6B00] text-white hover:bg-[#FF6B00] px-2 py-0.5 text-xs uppercase"
          style={{
            fontSize: "0.688rem",
            fontWeight: 600,
            letterSpacing: "0.05em"
          }}
        >
          OFERTA
        </Badge>
      )}
    </div>
  );
}

/**
 * PriceDisplaySimple Component
 * 
 * Versión simplificada sin Badge para usar en espacios más reducidos.
 * Muestra solo precio final y precio tachado.
 */
export function PriceDisplaySimple({
  price,
  originalPrice,
  size = "md",
  align = "left",
  className = "",
  inline = true
}: Omit<PriceDisplayProps, "showSaleChip">) {
  return (
    <PriceDisplay
      price={price}
      originalPrice={originalPrice}
      size={size}
      showSaleChip={false}
      align={align}
      className={className}
      inline={inline}
    />
  );
}
