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
  className = "" 
}: DiscountBadgeProps) {
  // Calcular porcentaje de descuento
  const discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

  // Configuración de tamaños
  const sizeStyles = {
    sm: "h-7 px-3 text-xs",
    md: "h-8 px-4 text-sm",
    lg: "h-10 px-5 text-base"
  };

  return (
    <motion.div
      className={`
        bg-[#FF6B00]
        ${sizeStyles[size]}
        text-white
        rounded-full
        border-2 border-white
        flex items-center justify-center
        ${className}
      `}
      style={{
        fontWeight: 700,
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
        minHeight: size === "sm" ? "28px" : size === "md" ? "32px" : "40px"
      }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "easeOut",
        repeatDelay: 2
      }}
    >
      -{discountPercentage}%
    </motion.div>
  );
}
