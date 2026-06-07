import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";

export interface CartItem {
  productId: string; // ✅ string para Firestore doc id
  name: string;
  image: string;
  price: number; // basePrice (sin IVA) -> tu UI le aplica IVA con settings
  quantity: number;
  stock: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: CartItem) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// -----------------------------
// ✅ LocalStorage (MVP persist)
// -----------------------------
const CART_STORAGE_KEY = "heypoint_cart_v1";
const CART_SYNC_DEBOUNCE_MS = 300;

function readCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function clearCartStorage() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore
  }
}

// -----------------------------
// Helpers API + Auth token
// -----------------------------
function apiBase() {
  return (import.meta as any).env?.VITE_API_URL || "";
}

async function getIdTokenSafe(): Promise<string | null> {
  // 1) Firebase client SDK
  try {
    const mod = await import("firebase/auth");
    const auth = mod.getAuth();
    const user = auth.currentUser;
    if (user) return await user.getIdToken();
  } catch {
    // ignore
  }

  // 2) LocalStorage fallbacks
  const keys = [
    "heypoint:idToken",
    "heypoint_token",
    "idToken",
    "token",
    "accessToken",
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.length > 20) return v;
  }

  return null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getIdTokenSafe();
  if (!token) throw new Error("Missing auth token");

  const res = await fetch(`${apiBase()}/api${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return {} as T;
  return (await res.json()) as T;
}

async function fetchProductSafe(productId: string) {
  try {
    const res = await fetch(`${apiBase()}/api/products/${productId}`);
    if (!res.ok) throw new Error("not ok");
    return await res.json();
  } catch {
    return null;
  }
}

// -----------------------------
// Provider
// -----------------------------
export function CartProvider({ children }: { children: ReactNode }) {
  // ✅ rehidrata en F5
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    readCartFromStorage(),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const syncTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const syncSequenceRef = useRef<Record<string, number>>({});
  const syncSnapshotsRef = useRef<Record<string, CartItem[]>>({});
  const syncInFlightRef = useRef<Record<string, boolean>>({});
  const syncLatestQuantityRef = useRef<Record<string, number>>({});

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  // ✅ Persistir carrito local (MVP)
  useEffect(() => {
    writeCartToStorage(cartItems);
  }, [cartItems]);

  // ✅ Cargar carrito al montar (si hay sesión) (BLINDADO)
  useEffect(() => {
    let alive = true;

    async function loadCart() {
      try {
        // ✅ si no hay token, nos quedamos con lo rehidratado
        const token = await getIdTokenSafe();
        if (!token) return;

        const data = await apiFetch<{
          items: Array<{ productId: string; qty: number }>;
        }>("/cart", { method: "GET" });

        const rawItems = data.items || [];

        // ✅ si server viene vacío, es verdad => vaciamos local
        if (rawItems.length === 0) {
          if (alive) setCartItems([]);
          return;
        }

        const hydrated = await Promise.all(
          rawItems.map(async (it) => {
            const p = await fetchProductSafe(it.productId);

            // Fallbacks por si el producto no existe/está oculto
            const name = String(p?.name || "Producto");
            const image =
              Array.isArray(p?.images) && p.images.length > 0
                ? p.images[0]
                : "";
            const basePrice = Number(p?.basePrice ?? p?.price ?? 0);
            const stock = Number(p?.stock ?? 0);

            return {
              productId: it.productId,
              name,
              image,
              price: basePrice,
              quantity: Number(it.qty ?? 1),
              stock,
            } as CartItem;
          }),
        );

        if (alive) setCartItems(hydrated);
      } catch {
        // ✅ si falla backend, NO vaciamos: seguimos con lo local
      }
    }

    loadCart();
    return () => {
      alive = false;
    };
  }, []);

  // Logout => limpiar local
  useEffect(() => {
    const handleLogout = () => {
      console.log("[CartContext] Logout detected - clearing cart");
      Object.values(syncTimersRef.current).forEach(clearTimeout);
      syncTimersRef.current = {};
      syncSequenceRef.current = {};
      syncSnapshotsRef.current = {};
      syncInFlightRef.current = {};
      syncLatestQuantityRef.current = {};
      setCartItems([]);
      clearCartStorage();
    };

    window.addEventListener("heypoint:logout", handleLogout);
    return () => window.removeEventListener("heypoint:logout", handleLogout);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(syncTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const rollbackProductFromSnapshot = (
    snapshot: CartItem[],
    productId: string,
  ) => {
    const previousItem = snapshot.find((item) => item.productId === productId);

    setCartItems((current) => {
      if (!previousItem) {
        return current.filter((item) => item.productId !== productId);
      }

      const exists = current.some((item) => item.productId === productId);
      if (exists) {
        return current.map((item) =>
          item.productId === productId ? previousItem : item,
        );
      }

      const previousIndex = snapshot.findIndex(
        (item) => item.productId === productId,
      );
      const next = [...current];
      next.splice(Math.max(previousIndex, 0), 0, previousItem);
      return next;
    });
  };

  const scheduleCartItemSync = (
    productId: string,
    quantity: number,
    snapshot: CartItem[],
  ) => {
    if (!syncSnapshotsRef.current[productId]) {
      syncSnapshotsRef.current[productId] = snapshot;
    }

    const sequence = (syncSequenceRef.current[productId] ?? 0) + 1;
    syncSequenceRef.current[productId] = sequence;
    syncLatestQuantityRef.current[productId] = quantity;

    const existingTimer = syncTimersRef.current[productId];
    if (existingTimer) clearTimeout(existingTimer);

    const flushLatestQuantity = async () => {
      if (syncInFlightRef.current[productId]) return;

      const activeSequence = syncSequenceRef.current[productId];
      const quantityToSend = syncLatestQuantityRef.current[productId];
      syncInFlightRef.current[productId] = true;

      try {
        await apiFetch("/cart/set", {
          method: "PATCH",
          body: JSON.stringify({ productId, qty: quantityToSend }),
        });

        if (
          syncSequenceRef.current[productId] === activeSequence &&
          syncLatestQuantityRef.current[productId] === quantityToSend
        ) {
          delete syncSnapshotsRef.current[productId];
          delete syncLatestQuantityRef.current[productId];
        }
      } catch (error) {
        if (syncSequenceRef.current[productId] === activeSequence) {
          console.error("Failed to update cart:", error);
          rollbackProductFromSnapshot(
            syncSnapshotsRef.current[productId] ?? snapshot,
            productId,
          );
          delete syncSnapshotsRef.current[productId];
          delete syncLatestQuantityRef.current[productId];
          toast.error("Error al actualizar el carrito", {
            description: "Restauramos la cantidad anterior. Intentá nuevamente.",
            duration: 3000,
          });
        }
      } finally {
        syncInFlightRef.current[productId] = false;

        if (
          syncSequenceRef.current[productId] !== activeSequence &&
          syncLatestQuantityRef.current[productId] !== undefined
        ) {
          syncTimersRef.current[productId] = setTimeout(
            flushLatestQuantity,
            0,
          );
          return;
        }

        delete syncTimersRef.current[productId];
      }
    };

    syncTimersRef.current[productId] = setTimeout(
      flushLatestQuantity,
      CART_SYNC_DEBOUNCE_MS,
    );
  };

  const addToCart = async (product: CartItem): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const existing = cartItems.find((x) => x.productId === product.productId);
      const currentQty = existing?.quantity ?? 0;
      const desired = currentQty + product.quantity;

      if (desired > product.stock) {
        const availableToAdd = product.stock - currentQty;

        if (availableToAdd <= 0) {
          toast.error("Cantidad máxima alcanzada", {
            description: `Ya tenés ${currentQty} unidades en el carrito (stock máximo: ${product.stock})`,
            duration: 3000,
          });
          return;
        }

        toast.warning("Stock ajustado", {
          description: `Solo se agregaron ${availableToAdd} unidades (stock disponible: ${product.stock})`,
          duration: 3000,
        });

        await apiFetch("/cart/add", {
          method: "POST",
          body: JSON.stringify({
            productId: product.productId,
            qty: availableToAdd,
          }),
        });

        setCartItems((prev) => {
          const i = prev.findIndex((x) => x.productId === product.productId);
          if (i >= 0) {
            const next = [...prev];
            next[i] = { ...next[i], quantity: product.stock };
            return next;
          }
          return [
            ...prev,
            { ...product, quantity: Math.min(product.stock, product.quantity) },
          ];
        });

        return;
      }

      await apiFetch("/cart/add", {
        method: "POST",
        body: JSON.stringify({
          productId: product.productId,
          qty: product.quantity,
        }),
      });

      setCartItems((prev) => {
        const idx = prev.findIndex((x) => x.productId === product.productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + product.quantity,
          };
          return next;
        }
        return [...prev, product];
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
    productId: string,
    quantity: number,
  ): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const item = cartItems.find((x) => x.productId === productId);
      const max = item?.stock ?? Infinity;
      const q = Math.max(0, Math.min(Number(quantity), max));

      await apiFetch("/cart/set", {
        method: "PATCH",
        body: JSON.stringify({ productId, qty: q }),
      });

      setCartItems((prev) => {
        if (q <= 0) return prev.filter((x) => x.productId !== productId);
        return prev.map((x) =>
          x.productId === productId ? { ...x, quantity: q } : x,
        );
      });

      if (q <= 0) toast.success("Producto eliminado del carrito");
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

  const removeFromCart = async (productId: string) => {
    try {
      await apiFetch(`/cart/${productId}`, { method: "DELETE" });
      setCartItems((prev) => prev.filter((x) => x.productId !== productId));
      toast.success("Producto eliminado del carrito");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el producto");
    }
  };

  const clearCart = async () => {
    try {
      await apiFetch("/cart/clear", { method: "POST" });
    } catch {
      // si falla server, igual limpiamos local para UX
    }
    setCartItems([]);
    clearCartStorage();
  };

  const updateCartItemOptimistic = async (
    productId: string,
    quantity: number,
  ): Promise<void> => {
    const snapshot = cartItems;
    const item = snapshot.find((x) => x.productId === productId);
    const max = item?.stock ?? Infinity;
    const q = Math.max(0, Math.min(Number(quantity), max));

    if (q <= 0) {
      await removeFromCartOptimistic(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((x) => (x.productId === productId ? { ...x, quantity: q } : x)),
    );

    scheduleCartItemSync(productId, q, snapshot);
  };

  const removeFromCartOptimistic = async (productId: string) => {
    const snapshot = cartItems;
    const existingTimer = syncTimersRef.current[productId];
    if (existingTimer) clearTimeout(existingTimer);
    delete syncTimersRef.current[productId];
    delete syncSnapshotsRef.current[productId];
    delete syncLatestQuantityRef.current[productId];

    const sequence = (syncSequenceRef.current[productId] ?? 0) + 1;
    syncSequenceRef.current[productId] = sequence;

    setCartItems((prev) => prev.filter((x) => x.productId !== productId));

    try {
      await apiFetch(`/cart/${productId}`, { method: "DELETE" });
      if (syncSequenceRef.current[productId] === sequence) {
        toast.success("Producto eliminado del carrito");
      }
    } catch (e) {
      if (syncSequenceRef.current[productId] === sequence) {
        console.error(e);
        rollbackProductFromSnapshot(snapshot, productId);
        toast.error("No se pudo eliminar el producto", {
          description: "Restauramos el carrito. Intentá nuevamente.",
        });
      }
    }
  };

  const clearCartOptimistic = async () => {
    Object.values(syncTimersRef.current).forEach(clearTimeout);
    syncTimersRef.current = {};
    syncSequenceRef.current = {};
    syncSnapshotsRef.current = {};
    syncInFlightRef.current = {};
    syncLatestQuantityRef.current = {};
    await clearCart();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateCartItem: updateCartItemOptimistic,
        removeFromCart: removeFromCartOptimistic,
        clearCart: clearCartOptimistic,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined)
    throw new Error("useCart must be used within a CartProvider");
  return context;
}
