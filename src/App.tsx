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
import { AboutPage } from "./pages/AboutPage";
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
  | "about"
  | "ourcompany"
  | "profile"
  | "cart"
  | "checkout"
  | "success"
  | "orders"
  | "terms"
  | "privacy";

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: string;
  badges?: string[];
}

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

  // Use contexts
  const { isAuthenticated, user, login, logout } = useAuth();
  const { openLoginModal, openSignupModal, closeAllModals, openedAt } =
    useModal();
  const { cartCount, clearCart } = useCart();

  // Derive user info from context
  const userName = user?.fullName || "User";
  const userEmail = user?.email || "";

  // Generate pickup code once - stable across renders
  const pickupCodeGenerated = useMemo(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evitar 0, O, 1, I, l
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }, []); // Empty deps = generate only once

  // Global window bridge for modal access from anywhere
  useEffect(() => {
    (window as any).heypoint = (window as any).heypoint || {};
    (window as any).heypoint.openLogin = openLoginModal;
    (window as any).heypoint.openSignup = openSignupModal;
    (window as any).heypoint.closeModals = closeAllModals;

    return () => {
      // Cleanup on unmount
      if ((window as any).heypoint) {
        delete (window as any).heypoint.openLogin;
        delete (window as any).heypoint.openSignup;
        delete (window as any).heypoint.closeModals;
      }
    };
  }, [openLoginModal, openSignupModal, closeAllModals]);

  // Close all modals when navigation changes (route-change behavior)
  // Guard: Don't close if modal was just opened (within 200ms)
  useEffect(() => {
    // Don't close if modal was opened very recently (prevents immediate close on open)
    if (openedAt && Date.now() - openedAt < 200) {
      return;
    }
    closeAllModals();
  }, [currentPage]); // Only run when page changes, not when openedAt changes

  // Listen for custom navigation events from HeaderAccountButton
  useEffect(() => {
    const handleCustomNavigation = (event: CustomEvent) => {
      const path = event.detail?.path;
      console.log("[App] Custom navigation event received:", path);

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
      handleCustomNavigation as EventListener
    );
    return () => {
      window.removeEventListener(
        "heypoint:navigate",
        handleCustomNavigation as EventListener
      );
    };
  }, []);

  // Listen for logout events and redirect to homepage
  useEffect(() => {
    const handleLogout = () => {
      console.log("[App] Logout event received - redirecting to home");
      setCurrentPage("home");
    };

    window.addEventListener("heypoint:logout", handleLogout);
    return () => {
      window.removeEventListener("heypoint:logout", handleLogout);
    };
  }, []);

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo(0, 0); // Instant scroll for page changes
  }, [currentPage]);

  // Track scroll position for chevron animation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroImages = [
    {
      url: "https://images.unsplash.com/photo-1754195451509-00c25c20fdde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB2ZW5kaW5nJTIwbWFjaGluZSUyMHN0b3JlfGVufDF8fHx8MTc2MjMxMjQ0Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      alt: "Modern HeyPoint! mini-store",
    },
    {
      url: "https://images.unsplash.com/photo-1611250308498-9e325502f8ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb252ZW5pZW5jZSUyMHN0b3JlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzYyMjk4NTYwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      alt: "HeyPoint! store interior",
    },
    {
      url: "https://images.unsplash.com/photo-1758721321642-485c02d07009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0ZWQlMjByZXRhaWwlMjBraW9za3xlbnwxfHx8fDE3NjIzMTI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      alt: "Automated retail technology",
    },
  ];

  // New categories for Spanish version
  const newCategories = [
    {
      name: "Snacks",
      items: 120,
      image:
        "https://images.unsplash.com/photo-1762417582697-f17df0c69348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmFja3MlMjBkaXNwbGF5JTIwc2hlbGZ8ZW58MXx8fHwxNzYzMDg4OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      name: "Bebidas",
      items: 90,
      image:
        "https://images.unsplash.com/photo-1672826979189-faae44e1b7a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXZlcmFnZXMlMjBkcmlua3MlMjBjb29sZXJ8ZW58MXx8fHwxNzYzMDg4OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      name: "Electrónica",
      items: 45,
      image:
        "https://images.unsplash.com/photo-1707485122968-56916bd2c464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMGdhZGdldHMlMjBkaXNwbGF5fGVufDF8fHx8MTc2MzA4ODk5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      name: "Higiene",
      items: 110,
      image:
        "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMGNhcmUlMjBwcm9kdWN0c3xlbnwxfHx8fDE3NjMwODkwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      name: "Otros",
      items: 75,
      image:
        "https://images.unsplash.com/photo-1651383140368-9b3ee59c2981?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcm96ZW4lMjBmb29kfGVufDF8fHx8MTc2MjIzNDM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

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

  const handleBackToShop = () => {
    setCurrentPage("shop");
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page as Page);
    // Clear category selection when navigating away from shop
    if (page !== "shop") {
      setSelectedCategory(null);
      setSearchQuery(""); // Clear search query when leaving shop
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage("shop");
  };

  const handleAuthRequired = () => {
    // This function is no longer needed - AuthModal handles it
    // Keeping for backward compatibility
    console.warn(
      "handleAuthRequired is deprecated. Use AuthModal component instead."
    );
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
    // Google sign-up skips email verification, goes straight to profile completion
    login({
      email: "user@gmail.com", // Would come from Google OAuth
      fullName,
    });
    setCurrentPage("completeProfile");
  };

  const handleAddToCart = () => {
    // This function is no longer needed - AddToCartButton handles it
    // Keeping for backward compatibility
    console.warn(
      "handleAddToCart is deprecated. Use AddToCartButton component instead."
    );
  };

  // Smooth scroll to "How It Works" section
  const scrollToHowItWorks = () => {
    const section = document.getElementById("como-funciona");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Render the appropriate page based on currentPage state
  if (currentPage === "shop") {
    return (
      <>
        <ShopPage
          onProductClick={handleProductClick}
          onNavigate={handleNavigation}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      </>
    );
  }

  if (currentPage === "productDetails" && selectedProduct) {
    return (
      <>
        <ProductDetailsPage
          product={selectedProduct}
          onBack={handleBackToShop}
          onNavigate={handleNavigation}
          onProductClick={handleProductClick}
        />
      </>
    );
  }

  if (currentPage === "contact") {
    return (
      <>
        <ContactPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "about") {
    return (
      <>
        <AboutPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "ourcompany") {
    return (
      <>
        <OurCompanyPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "profile") {
    return (
      <>
        <UserProfilePage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "cart") {
    return (
      <>
        <ShoppingCartPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "checkout") {
    return (
      <>
        <CheckoutPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "success") {
    return (
      <>
        <PurchaseSuccessPage
          onNavigate={handleNavigation}
          userEmail={userEmail}
          userName={userName}
          pickupCode={pickupCodeGenerated}
          onClearCart={clearCart}
        />
      </>
    );
  }

  if (currentPage === "orders") {
    return (
      <>
        <MyOrdersPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "terms") {
    return (
      <>
        <TermsPage onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === "privacy") {
    return (
      <>
        <PrivacyPage onNavigate={handleNavigation} />
      </>
    );
  }

  // Home Page
  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      {/* Header */}
      <UnifiedHeader
        onNavigate={handleNavigation}
        currentPage={currentPage}
        onCategorySelect={handleCategorySelect}
        isTransparent={currentPage === "home"}
      />

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-[#FFF4E6]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1629643476559-69bdc26d7331?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0ZWQlMjBzbWFydCUyMGtpb3NrJTIwZGFya3xlbnwxfHx8fDE3NjMzNTM5ODR8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="HeyPoint! Estación inteligente automatizada"
            className="w-full h-full object-cover"
          />
          {/* Single overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Main Headline */}
            <h1 className="text-white text-5xl md:text-7xl mb-6 font-[Inter] font-bold text-[48px]">
              Comprá online.
              <br />
              Retirá en minutos.
            </h1>

            {/* Subheadline */}
            <p className="text-white/95 max-w-2xl mx-auto text-lg md:text-xl">
              Elegí tus productos, pagá online y retirá en tu HeyPoint.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-3xl mx-auto mt-10">
              {/* Primary CTA Button */}
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

              {/* Search Bar */}
              <motion.div className="w-full sm:w-auto sm:flex-1 sm:max-w-md">
                <SmartSearchBar
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    setCurrentPage("productDetails");
                  }}
                  onViewAllResults={(query) => {
                    setSearchQuery(query);
                    setSelectedCategory(null);
                    setCurrentPage("shop");
                  }}
                />
              </motion.div>

              {/* Secondary CTA - How to Buy Button */}
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

        {/* Scroll Indicator */}
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

          {/* Categories Grid/Carousel - Responsive */}
          <div className="relative">
            {/* Mobile: Horizontal Scroll Carousel */}
            <div className="md:hidden overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-4 pl-4 pr-4 min-w-max">
                {newCategories.map((category, index) => (
                  <motion.button
                    key={category.name}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category.name)}
                    className="flex-shrink-0 w-[calc(50vw-24px)] min-w-[140px] max-w-[180px] snap-start group"
                  >
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      {/* Category Image */}
                      <div className="relative h-36 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2335]/70 via-[#1C2335]/20 to-transparent" />

                        {/* Items Badge */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                          <p className="text-[#FF6B00] text-xs">
                            {category.items}+ items
                          </p>
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className="p-4 bg-white">
                        <h4 className="text-[#1C2335] text-center text-base line-clamp-2">
                          {category.name}
                        </h4>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 group-hover:from-[#FF6B00]/10 group-hover:to-[#FF8534]/10 transition-all duration-300 pointer-events-none" />
                    </Card>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Desktop: Centered Grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {newCategories.map((category, index) => (
                  <motion.button
                    key={category.name}
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
                      {/* Category Image */}
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C2335]/70 via-[#1C2335]/20 to-transparent" />

                        {/* Items Badge */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                          <p className="text-[#FF6B00] text-xs">
                            {category.items}+ items
                          </p>
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className="p-5 bg-white">
                        <h4 className="text-[#1C2335] text-center text-lg">
                          {category.name}
                        </h4>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 group-hover:from-[#FF6B00]/10 group-hover:to-[#FF8534]/10 transition-all duration-300 pointer-events-none" />
                    </Card>
                  </motion.button>
                ))}
              </div>
            </div>
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

      {/* CTA Section - Final */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-[#FF6B00] via-[#FF7B1A] to-[#FF8534] overflow-hidden">
        {/* Decorative Elements */}
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

      {/* Footer */}
      <Footer onNavigate={handleNavigation} />
    </div>
  );
}
