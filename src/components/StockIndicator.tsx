import { Badge } from "./ui/badge";
import { Check, AlertTriangle, X } from "lucide-react";

interface StockIndicatorProps {
  stock: number;
  variant?: "card" | "detail";
  className?: string;
}

/**
 * StockIndicator Component
 * 
 * Displays stock status with consistent logic across web and kiosk
 * 
 * Rules for CARD variant (shop grid):
 * - stock > 5: No display
 * - 1 ≤ stock ≤ 5: "Últimas X unidades" (warning)
 * - stock = 0: "Agotado" (out of stock)
 * 
 * Rules for DETAIL variant (product page):
 * - stock ≥ 10: Green badge "Stock disponible: X unidades"
 * - 1 ≤ stock < 10: Yellow badge "Últimas X unidades disponibles"
 * - stock = 0: Gray badge "Agotado"
 * 
 * @param stock - Number of units available
 * @param variant - "card" (small, subtle) or "detail" (larger, prominent)
 * @param className - Optional additional classes
 */
export function StockIndicator({ stock, variant = "card", className = "" }: StockIndicatorProps) {
  // DETAIL VARIANT - Always show stock status with full badge system
  if (variant === "detail") {
    // Out of stock
    if (stock === 0) {
      return (
        <div className={`inline-flex items-center gap-2.5 bg-[#F3F4F6] border-2 border-[#D1D5DB] rounded-xl px-4 py-3 ${className}`}>
          <X className="w-5 h-5 text-[#999] flex-shrink-0" />
          <span className="text-[#666]" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
            Agotado
          </span>
        </div>
      );
    }
    
    // High stock (≥ 10 units)
    if (stock >= 10) {
      return (
        <div className={`inline-flex items-center gap-2.5 bg-[#ECFDF5] border-2 border-[#6EE7B7] rounded-xl px-4 py-3 ${className}`}>
          <Check className="w-5 h-5 text-[#059669] flex-shrink-0" />
          <span className="text-[#047857]" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
            Stock disponible: {stock} unidades
          </span>
        </div>
      );
    }
    
    // Low stock (1-9 units)
    return (
      <div className={`inline-flex items-center gap-2.5 bg-[#FFFBEB] border-2 border-[#FCD34D] rounded-xl px-4 py-3 ${className}`}>
        <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
        <span className="text-[#D97706]" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
          Últimas {stock} {stock === 1 ? 'unidad disponible' : 'unidades disponibles'}
        </span>
      </div>
    );
  }

  // CARD VARIANT - Only show when stock is low or out
  // Don't show anything if stock is high
  if (stock > 5) {
    return null;
  }

  // Out of stock
  if (stock === 0) {
    return (
      <Badge 
        className={`bg-[#999] text-white border-none px-2 py-0.5 ${className}`} 
        style={{ fontSize: '0.688rem', fontWeight: 600 }}
      >
        Agotado
      </Badge>
    );
  }

  // Low stock (1-5 units)
  return (
    <p 
      className={`text-[#777] ${className}`} 
      style={{ fontSize: '0.688rem', fontWeight: 500 }}
    >
      Últimas {stock} {stock === 1 ? 'unidad' : 'unidades'}
    </p>
  );
}