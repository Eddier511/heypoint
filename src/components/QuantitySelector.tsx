import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  size?: "compact" | "default" | "large";
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
  const containerHeight =
    size === "large" ? "h-14" : size === "compact" ? "h-10" : "h-11";
  const buttonSize =
    size === "large"
      ? "w-14 h-14"
      : size === "compact"
        ? "w-9 h-9"
        : "w-11 h-11";
  const fontSize =
    size === "large" ? "1.125rem" : size === "compact" ? "0.938rem" : "1rem";
  const iconSize = size === "large" ? "w-5 h-5" : "w-4 h-4";
  const containerGap = size === "compact" ? "gap-1" : "gap-2 sm:gap-3";
  const containerPadding = size === "compact" ? "px-1" : "px-2 sm:px-2";
  const buttonRadius = size === "compact" ? "rounded-md" : "rounded-lg";
  const buttonChrome =
    size === "compact"
      ? "bg-transparent border border-transparent disabled:hover:bg-transparent disabled:hover:border-transparent"
      : "bg-white border border-[#E5E7EB] disabled:hover:bg-white disabled:hover:border-[#E5E7EB]";

  return (
    <div 
      className={`flex items-center ${containerGap} bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl ${containerPadding} w-fit mx-auto sm:mx-0 ${containerHeight}`}
      role="group"
      aria-label="Selector de cantidad"
    >
      {/* Decrement Button */}
      <Button
        onClick={handleDecrement}
        disabled={isDecrementDisabled}
        className={`${buttonSize} ${buttonRadius} ${buttonChrome} hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-white disabled:opacity-40 disabled:hover:text-[#2E2E2E] text-[#2E2E2E] transition-all p-0 flex items-center justify-center`}
        aria-label="Disminuir cantidad"
        type="button"
      >
        <Minus className={iconSize} />
      </Button>

      {/* Quantity Display */}
      <div 
        className="flex items-center justify-center min-w-7 px-1 text-[#1C2335] select-none"
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
        className={`${buttonSize} ${buttonRadius} ${buttonChrome} hover:bg-[#FF6B00] hover:border-[#FF6B00] hover:text-white disabled:opacity-40 disabled:hover:text-[#2E2E2E] text-[#2E2E2E] transition-all p-0 flex items-center justify-center`}
        aria-label="Aumentar cantidad"
        type="button"
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  );
}
