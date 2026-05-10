import { motion } from "motion/react";

interface SaleChipProps {
  variant?: "red" | "orange" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SaleChip({
  variant = "red",
  size = "md",
  className = "",
}: SaleChipProps) {
  const variantStyles = {
    red: "bg-[#EF4444]",
    orange: "bg-[#FF6B00]",
    gradient: "bg-gradient-to-br from-[#EF4444] to-[#DC2626]",
  };

  // Equal width + height → perfect circle
  const sizeStyles = {
    sm: "w-8 h-8 text-[0.6rem]",
    md: "w-10 h-10 text-[0.688rem]",
    lg: "w-11 h-11 text-xs",
  };

  const shadowByVariant = {
    red: "0 3px 10px rgba(239,68,68,0.35)",
    orange: "0 3px 10px rgba(255,107,0,0.30)",
    gradient: "0 3px 10px rgba(239,68,68,0.35)",
  };

  return (
    <motion.div
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        text-white
        rounded-full
        border-2 border-white
        flex items-center justify-center
        select-none
        ${className}
      `}
      style={{
        fontWeight: 800,
        letterSpacing: "0.05em",
        lineHeight: 1,
        boxShadow: shadowByVariant[variant],
      }}
      animate={{
        scale: [1, 1.07, 1],
        rotate: [0, -3, 3, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut",
        repeatDelay: 3.5,
      }}
    >
      SALE
    </motion.div>
  );
}
