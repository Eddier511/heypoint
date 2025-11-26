import { motion } from "motion/react";

interface SaleChipProps {
  variant?: "orange" | "red" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SaleChip({ variant = "orange", size = "md", className = "" }: SaleChipProps) {
  // Configuración de variantes
  const variantStyles = {
    orange: "bg-[#FF6B00]",
    red: "bg-[#E53935]",
    gradient: "bg-gradient-to-r from-[#FF6B00] to-[#FF8C2A]"
  };

  // Configuración de tamaños
  const sizeStyles = {
    sm: "h-7 px-3 text-xs",
    md: "h-8 px-4 text-sm",
    lg: "h-10 px-5 text-base"
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
        ${className}
      `}
      style={{
        fontWeight: 700,
        boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
        minHeight: size === "sm" ? "28px" : size === "md" ? "32px" : "40px"
      }}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: "easeOut",
        repeatDelay: 2
      }}
    >
      SALE
    </motion.div>
  );
}
