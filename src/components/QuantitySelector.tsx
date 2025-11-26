import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: "default" | "large";
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 10,
  size = "default"
}: QuantitySelectorProps) {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const isDecrementDisabled = quantity <= min;
  const isIncrementDisabled = quantity >= max;

  // Size-specific styling
  const containerHeight = size === "large" ? "h-14" : "h-11";
  const buttonSize = size === "large" ? "w-14 h-14" : "w-11 h-11";
  const fontSize = size === "large" ? "1.125rem" : "1rem";
  const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";

  return (
    <div 
      className={`flex items-center gap-2 sm:gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-2 sm:px-2 w-fit mx-auto sm:mx-0 ${containerHeight}`}
      role="group"
      aria-label="Selector de cantidad"
    >
      {/* Decrement Button */}
      <Button
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        className={`${buttonSize} rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E5E7EB] disabled:hover:text-[#2E2E2E] text-[#2E2E2E] transition-all p-0 flex items-center justify-center`}
        aria-label="Disminuir cantidad"
        type="button"
      >
        <Minus className={iconSize} />
      </Button>

      {/* Quantity Display */}
      <div 
        className="flex items-center justify-center min-w-8 px-2 text-[#1C2335] select-none"
        style={{ fontSize, fontWeight: 600 }}
        aria-live="polite"
        aria-atomic="true"
      >
        {quantity}
      </div>

      {/* Increment Button */}
      <Button
        onClick={handleIncrement}
        disabled={isIncrementDisabled}
        className={`${buttonSize} rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E5E7EB] disabled:hover:text-[#2E2E2E] text-[#2E2E2E] transition-all p-0 flex items-center justify-center`}
        aria-label="Aumentar cantidad"
        type="button"
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  );
}