import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  ShoppingBag,
  CreditCard,
  QrCode,
  Zap,
  Clock,
  Shield,
  Store,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Toaster } from "./components/ui/sonner";
import ModalRoot from "./components/ModalRoot";
import { GlobalModalBridge } from "./components/GlobalModalBridge";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { CartProvider, useCart } from "./contexts/CartContext";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import { UnifiedHeader } from "./components/UnifiedHeader";
import { BackToTopButton } from "./components/BackToTopButton";
import { SmartSearchBar } from "./components/SmartSearchBar";
import { Footer } from "./components/Footer";
import { ShopPage } from "./pages/ShopPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { ContactPage } from "./pages/ContactPage";
import { BusinessPage } from "./pages/BusinessPage";
import { OurCompanyPage } from "./pages/OurCompanyPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { ShoppingCartPage } from "./pages/ShoppingCartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PurchaseSuccessPage } from "./pages/PurchaseSuccessPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";

type Page =
  | "home"
  | "shop"
  | "productDetails"
  | "contact"
  | "business"
  | "ourcompany"
  | "profile"
  | "cart"
  | "checkout"
  | "success"
  | "orders"
  | "terms"
  | "privacy";

/**
 * ✅ Product actualizado para buscador/Firestore
 * - id: string (no number)
 */
interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  category: string;
  badges?: string[];
}

/** =========================
 * API helper (categorías Home)
 * ========================= */
const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ORIGIN}/api${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** =========================
 * Category DTOs
 * ========================= */
type ApiCategory = {
  id: string;
  name: string;
  productCount?: number;
  status?: "active" | "inactive";
  imageUrl?: string;
};
type ApiCategoriesResponse = ApiCategory[] | { categories: ApiCategory[] };

type UiCategory = {
  id: string;
  name: string;
  items: number;
  image: string;
};

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <ModalRoot />
          <GlobalModalBridge />
          <AppContent />
        </CartProvider>
      </ModalProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scrollY, setScrollY] = useState(0);

  // ✅ categorías API
  const [dbCategories, setDbCategories] = useState<UiCategory[]>([]);
  // 🔥 ya no usamos loader visual para home categorías
  // (seguimos guardando el estado por si lo ocupás en otro lado)
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Use contexts
  const { user, login, loadingAuth } = useAuth();
  const { openLoginModal, openSignupModal, closeAllModals, openedAt } =
    useModal();
  const { clearCart } = useCart();

  const userName = user?.fullName || "User";
  const userEmail = user?.email || "";

  const pickupCodeGenerated = useMemo(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }, []);

  useEffect(() => {
    (window as any).heypoint = (window as any).heypoint || {};
    (window as any).heypoint.openLogin = openLoginModal;
    (window as any).heypoint.openSignup = openSignupModal;
    (window as any).heypoint.closeModals = closeAllModals;

    return () => {
      if ((window as any).heypoint) {
        delete (window as any).heypoint.openLogin;
        delete (window as any).heypoint.openSignup;
        delete (window as any).heypoint.closeModals;
      }
    };
  }, [openLoginModal, openSignupModal, closeAllModals]);

  useEffect(() => {
    if (openedAt && Date.now() - openedAt < 200) return;
    closeAllModals();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleCustomNavigation = (event: CustomEvent) => {
      const path = event.detail?.path;

      if (path === "/account" || path === "profile") {
        setCurrentPage("profile");
      } else if (path === "/orders") {
        setCurrentPage("orders");
      } else if (path === "/cart") {
        setCurrentPage("cart");
      }
    };

    window.addEventListener(
      "heypoint:navigate",
      handleCustomNavigation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "heypoint:navigate",
        handleCustomNavigation as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      if (loadingAuth) return;

      // ✅ si el usuario está en carrito, no lo saqués de ahí
      setCurrentPage((prev) => (prev === "cart" ? "cart" : "home"));
    };

    window.addEventListener("heypoint:logout", handleLogout);
    return () => window.removeEventListener("heypoint:logout", handleLogout);
  }, [loadingAuth]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** =========================
   * ✅ FALLBACK LOCAL (se pinta INMEDIATO)
   * ========================= */
  const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=HeyPoint";

  const newCategories: UiCategory[] = [
    {
      id: "snacks",
      name: "Snacks",
      items: 120,
      image:
        "https://images.unsplash.com/photo-1762417582697-f17df0c69348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: "bebidas",
      name: "Bebidas",
      items: 90,
      image:
        "https://images.unsplash.com/photo-1672826979189-faae44e1b7a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: "electronica",
      name: "Electrónica",
      items: 45,
      image:
        "https://images.unsplash.com/photo-1707485122968-56916bd2c464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: "higiene",
      name: "Higiene",
      items: 110,
      image:
        "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
    {
      id: "otros",
      name: "Otros",
      items: 75,
      image:
        "https://images.unsplash.com/photo-1651383140368-9b3ee59c2981?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    },
  ];

  /** =========================
   * ✅ cargar categorías desde backend (SIN loader en UI)
   * - pinta fallback al instante
   * - cuando llega API, reemplaza
   * ========================= */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingCategories(true);

        const raw = await apiGet<ApiCategoriesResponse>("/categories");
        const list = Array.isArray(raw) ? raw : raw?.categories || [];
        const active = list.filter((c) => c.status !== "inactive");

        const FALLBACK_IMAGES: Record<string, string> = {
          Snacks:
            "https://images.unsplash.com/photo-1762417582697-f17df0c69348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          Bebidas:
            "https://images.unsplash.com/photo-1672826979189-faae44e1b7a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          Electrónica:
            "https://images.unsplash.com/photo-1707485122968-56916bd2c464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          Higiene:
            "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          Otros:
            "https://images.unsplash.com/photo-1651383140368-9b3ee59c2981?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        };

        const mapped: UiCategory[] = active.map((c) => ({
          id: c.id,
          name: c.name,
          items: Number(c.productCount ?? 0),
          image: c.imageUrl || FALLBACK_IMAGES[c.name] || PLACEHOLDER_IMG,
        }));

        // ✅ si API viene vacío, no rompas el fallback
        if (!alive) return;
        if (mapped.length > 0) setDbCategories(mapped);
      } catch (e) {
        console.warn("[Home] Failed to load categories", e);
        // ✅ no seteamos [] para no “borrar” fallback
      } finally {
        if (alive) setLoadingCategories(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ lo que se muestra (carga de una):
  const homeCategories = dbCategories.length ? dbCategories : newCategories;

  const howItWorksSteps = [
    {
      icon: <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Elegí",
      description: "Explorá la tienda y seleccioná tus productos.",
    },
    {
      icon: <CreditCard className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Pagá",
      description: "Pagá de forma rápida y segura desde tu celular.",
    },
    {
      icon: <QrCode className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Retirá",
      description: "Ingresá tu código alfanumérico y retiralo en tu HeyPoint.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Sin filas",
      description: "Comprá cuando quieras, sin esperas",
    },
    {
      icon: <Clock className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Disponible 24/7",
      description: "Siempre abierto, siempre listo",
    },
    {
      icon: <CreditCard className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Pagos digitales",
      description: "Todos los métodos de pago aceptados",
    },
    {
      icon: <Shield className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Retiro seguro",
      description: "Tu pedido protegido y listo",
    },
  ];

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("productDetails");
  };

  const handleBackToShop = () => setCurrentPage("shop");

  const handleNavigation = (page: string) => {
    setCurrentPage(page as Page);
    if (page !== "shop") {
      setSelectedCategory(null);
      setSearchQuery("");
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage("shop");
  };

  const handleLoginSuccess = (userData?: any) => {
    if (userData) {
      login({
        email: userData.email || "",
        fullName: userData.fullName || "User",
      });
    }
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSignUpSuccess = (email: string, fullName: string) => {
    login({ email, fullName });
    setCurrentPage("success");
  };

  const handleGoogleSignUpSuccess = (fullName: string) => {
    login({
      email: "user@gmail.com",
      fullName,
    });
    setCurrentPage("success");
  };

  const scrollToHowItWorks = () => {
    const section = document.getElementById("como-funciona");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Render pages
  if (currentPage === "shop") {
    return (
      <ShopPage
        onProductClick={handleProductClick}
        onNavigate={handleNavigation}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
      />
    );
  }

  if (currentPage === "productDetails" && selectedProduct) {
    return (
      <ProductDetailsPage
        product={selectedProduct}
        onBack={handleBackToShop}
        onNavigate={handleNavigation}
        onProductClick={handleProductClick}
      />
    );
  }

  if (currentPage === "contact")
    return <ContactPage onNavigate={handleNavigation} />;
  if (currentPage === "business")
    return <BusinessPage onNavigate={handleNavigation} />;
  if (currentPage === "ourcompany")
    return <OurCompanyPage onNavigate={handleNavigation} />;
  if (currentPage === "profile")
    return <UserProfilePage onNavigate={handleNavigation} />;
  if (currentPage === "cart")
    return <ShoppingCartPage onNavigate={handleNavigation} />;
  if (currentPage === "checkout")
    return <CheckoutPage onNavigate={handleNavigation} />;

  if (currentPage === "success") {
    return (
      <PurchaseSuccessPage
        onNavigate={handleNavigation}
        userEmail={userEmail}
        userName={userName}
        pickupCode={pickupCodeGenerated}
        onClearCart={clearCart}
      />
    );
  }

  if (currentPage === "orders")
    return <MyOrdersPage onNavigate={handleNavigation} />;
  if (currentPage === "terms")
    return <TermsPage onNavigate={handleNavigation} />;
  if (currentPage === "privacy")
    return <PrivacyPage onNavigate={handleNavigation} />;

  // Home Page
  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={handleNavigation}
        currentPage={currentPage}
        onCategorySelect={handleCategorySelect}
        isTransparent={currentPage === "home"}
      />

      <BackToTopButton />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#FFF4E6]">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2Fbg-banner-hey-point.png?alt=media&token=4c622e18-92de-4b26-85db-b293da0030e6"
            alt="HeyPoint! Estación inteligente automatizada"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h1 className="text-white text-5xl md:text-7xl mb-6 font-[Inter] font-bold text-[48px]">
              Comprá online.
              <br />
              Retirá en minutos.
            </h1>

            <p className="text-white/95 max-w-2xl mx-auto text-lg md:text-xl">
              Elegí tus productos, pagá online y retirá en tu HeyPoint.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-3xl mx-auto mt-10">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={() => handleNavigation("shop")}
                  className="w-full sm:w-auto h-14 px-8 bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Store className="w-5 h-5" />
                  Entrar a la tienda
                </Button>
              </motion.div>

              <motion.div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
                <SmartSearchBar
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    setCurrentPage("productDetails");
                  }}
                  onViewAllResults={(q) => {
                    setSearchQuery(q);
                    setSelectedCategory(null);
                    setCurrentPage("shop");
                  }}
                />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={scrollToHowItWorks}
                  variant="outline"
                  aria-label="Ir a Cómo comprar"
                  className="w-full sm:w-auto h-14 px-8 bg-white/10 hover:bg-white/20 border-2 border-white/40 hover:border-white/60 text-white rounded-full backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={scrollY < 100 ? { y: [0, 3, 0] } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: scrollY < 100 ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                  ¿Cómo comprar?
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 border-2 border-white/70 rounded-full flex items-start justify-center p-2 backdrop-blur-sm">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white" id="como-funciona">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4">
              Cómo funciona
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              3 pasos simples para comprar y retirar
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-6 text-center border-none shadow-lg rounded-3xl bg-gradient-to-br from-[#FFF8F0] via-[#FFF4E6] to-white hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#FF6B00] to-[#FF8534] text-white rounded-2xl md:rounded-3xl mb-6 shadow-md">
                    {step.icon}
                  </div>
                  <div className="mb-2 text-[#FF6B00]">Paso {index + 1}</div>
                  <h3 className="text-[#1C2335] text-xl md:text-2xl mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#2E2E2E] text-base">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-16 md:py-24 bg-[#FFF4E6]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4">
              Categorías
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              Explorá nuestros productos
            </p>
          </motion.div>

          <div className="relative">
            {/* ✅ SIN loader: pinta directo con fallback, luego se reemplaza */}

            {/* Mobile */}
            <div className="md:hidden overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-4 pl-4 pr-4 min-w-max">
                {homeCategories.map((category, index) => (
                  <motion.button
                    key={category.id || category.name}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category.name)}
                    className="flex-shrink-0 w-[calc(50vw-24px)] min-w-[140px] max-w-[180px] snap-start group"
                  >
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative h-36 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2335]/70 via-[#1C2335]/20 to-transparent" />

                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                          <p className="text-[#FF6B00] text-xs">
                            {category.items}+ items
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-white">
                        <h4 className="text-[#1C2335] text-center text-base line-clamp-2">
                          {category.name}
                        </h4>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 group-hover:from-[#FF6B00]/10 group-hover:to-[#FF8534]/10 transition-all duration-300 pointer-events-none" />
                    </Card>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {homeCategories.map((category, index) => (
                  <motion.button
                    key={category.id || category.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category.name)}
                    className="group"
                  >
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2335]/70 via-[#1C2335]/20 to-transparent" />

                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                          <p className="text-[#FF6B00] text-xs">
                            {category.items}+ items
                          </p>
                        </div>
                      </div>

                      <div className="p-5 bg-white">
                        <h4 className="text-[#1C2335] text-center text-lg">
                          {category.name}
                        </h4>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 group-hover:from-[#FF6B00]/10 group-hover:to-[#FF8534]/10 transition-all duration-300 pointer-events-none" />
                    </Card>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* (opcional) si querés, podés usar loadingCategories para algo sutil:
                ej. un shimmer o una barra arriba. Por ahora lo dejamos sin UI. */}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4">
              ¿Por qué HeyPoint?
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              Comprá inteligente, retirá rápido
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="p-6 border-none shadow-lg rounded-3xl bg-gradient-to-br from-white to-[#FFF8F0] hover:shadow-xl transition-all duration-300">
                  <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF6B00]/10 to-[#FF8534]/10 text-[#FF6B00] rounded-2xl mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-[#1C2335] text-lg md:text-xl mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-[#2E2E2E] text-sm md:text-base">
                    {benefit.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-[#FF6B00] via-[#FF7B1A] to-[#FF8534] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </motion.div>

            <h2 className="text-white text-3xl md:text-5xl mb-6">
              Encontrá el HeyPoint más cercano
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Descubrí la forma más inteligente de hacer tus compras. Rápido,
              seguro y siempre disponible.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleNavigation("shop")}
                className="h-14 md:h-16 px-10 md:px-12 bg-white hover:bg-[#FFF4E6] text-[#FF6B00] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                <Store className="w-5 h-5 md:w-6 md:h-6" />
                Explorar tienda
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer onNavigate={handleNavigation} />
    </div>
  );
}

/**
 * ✅ API requerido (backend):
 * GET {VITE_API_URL}/api/categories
 */
