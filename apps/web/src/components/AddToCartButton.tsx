import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useModal } from "../contexts/ModalContext";

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  className?: string;
  variant?: "default" | "compact";
  disabled?: boolean;
  stock: number; // Add stock property
}

export function AddToCartButton({
  productId,
  productName,
  productImage,
  productPrice,
  quantity,
  className = "",
  variant = "default",
  disabled = false,
  stock,
}: AddToCartButtonProps) {
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering

    // Validation
    if (!productId || !productName || !productPrice || quantity < 1) {
      console.error("Invalid product data:", {
        productId,
        productName,
        productPrice,
        quantity,
      });
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    // Add to cart
    setIsLoading(true);
    try {
      await addToCart({
        productId,
        name: productName,
        image: productImage,
        price: productPrice,
        quantity,
        stock,
      });
    } catch (error) {
      // Error already handled in cart context with toast
      console.error("Add to cart failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = disabled || isLoading || !productId || stock <= 0;

  const buttonContent = (
    <Button
      onClick={handleAddToCart}
      disabled={isButtonDisabled}
      className={`${
        variant === "compact" ? "flex-1" : "w-full"
      } bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full h-11 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ fontSize: "0.938rem", fontWeight: 600 }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Agregando...
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          <span className="md:hidden">Agregar</span>
          <span className="hidden md:inline">Agregar al carrito</span>
        </>
      )}
    </Button>
  );

  // Show tooltip if button is disabled for a specific reason
  if (isButtonDisabled && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>
              {!productId
                ? "Producto no disponible"
                : disabled
                ? "No disponible en este momento"
                : stock <= 0
                ? "Sin stock"
                : "Intentá nuevamente"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}