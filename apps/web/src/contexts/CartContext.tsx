import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { toast } from "sonner";

export interface CartItem {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number; // Add stock property
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: CartItem) => Promise<void>;
  updateCartItem: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Listen for logout events and clear the cart
  useEffect(() => {
    const handleLogout = () => {
      console.log("[CartContext] Logout detected - clearing cart");
      setCartItems([]);
    };

    window.addEventListener("heypoint:logout", handleLogout);
    return () => {
      window.removeEventListener("heypoint:logout", handleLogout);
    };
  }, []);

  const addToCart = async (product: CartItem): Promise<void> => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCartItems((prevItems) => {
        const existingItem = prevItems.find(
          (item) => item.productId === product.productId
        );

        if (existingItem) {
          // Calculate new total quantity
          const newTotalQuantity = existingItem.quantity + product.quantity;

          // Check if new quantity would exceed stock
          if (newTotalQuantity > product.stock) {
            const availableToAdd = product.stock - existingItem.quantity;

            if (availableToAdd <= 0) {
              // Already at max stock
              toast.error("Cantidad máxima alcanzada", {
                description: `Ya tenés ${existingItem.quantity} unidades en el carrito (stock máximo: ${product.stock})`,
                duration: 3000,
              });
              return prevItems; // Don't update
            } else {
              // Add only what's available
              toast.warning("Stock ajustado", {
                description: `Solo se agregaron ${availableToAdd} unidades (stock disponible: ${product.stock})`,
                duration: 3000,
              });
              return prevItems.map((item) =>
                item.productId === product.productId
                  ? { ...item, quantity: product.stock }
                  : item
              );
            }
          }

          // Update quantity if within stock limits
          return prevItems.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: newTotalQuantity }
              : item
          );
        } else {
          // Check stock for new item
          if (product.quantity > product.stock) {
            toast.warning("Stock ajustado", {
              description: `Solo se agregaron ${product.stock} unidades (stock disponible: ${product.stock})`,
              duration: 3000,
            });
            return [...prevItems, { ...product, quantity: product.stock }];
          }

          // Add new item
          return [...prevItems, product];
        }
      });

      toast.success("Agregado al carrito", {
        description: `${product.name} (${product.quantity}x) agregado exitosamente`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Error al agregar al carrito", {
        description: "Por favor intentá nuevamente",
        duration: 3000,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCartItem = async (
    productId: number,
    quantity: number
  ): Promise<void> => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      setCartItems((prevItems) => {
        if (quantity <= 0) {
          return prevItems.filter((item) => item.productId !== productId);
        }
        return prevItems.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
      });

      if (quantity <= 0) {
        toast.success("Producto eliminado del carrito");
      }
    } catch (error) {
      console.error("Failed to update cart:", error);
      toast.error("Error al actualizar el carrito", {
        description: "Por favor intentá nuevamente",
        duration: 3000,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
    toast.success("Producto eliminado del carrito");
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
