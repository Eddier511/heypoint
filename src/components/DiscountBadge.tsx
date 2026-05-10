import { motion } from "motion/react";

interface DiscountBadgeProps {
  originalPrice: number;
  currentPrice: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DiscountBadge({
  originalPrice,
  currentPrice,
  size = "md",
  className = "",
}: DiscountBadgeProps) {
  const discountPercentage = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100,
  );

  // Pill shape (not circular) for percentage — needs horizontal space for "−XX%"
  const sizeStyles = {
    sm: "h-7 px-3 text-xs",
    md: "h-8 px-4 text-sm",
    lg: "h-10 px-5 text-base",
  };

  return (
    <motion.div
      className={`
        bg-[#EF4444]
        ${sizeStyles[size]}
        text-white
        rounded-full
        border-2 border-white
        flex items-center justify-center
        select-none
        ${className}
      `}
      style={{
        fontWeight: 700,
        boxShadow: "0 3px 10px rgba(239,68,68,0.35)",
        minHeight: size === "sm" ? "28px" : size === "md" ? "32px" : "40px",
      }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        ease: "easeOut",
        repeatDelay: 3,
      }}
    >
      -{discountPercentage}%
    </motion.div>
  );
}
