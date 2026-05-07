// src/components/UnifiedHeader.tsx
import {
  ShoppingCart,
  Menu,
  X,
  User,
  ChevronDown,
  Home,
  Store,
  Info,
  Mail,
  Package,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useCart } from "../contexts/CartContext";
import { useHasPendingOrders } from "../hooks/useHasPendingOrders";
import { toast } from "sonner";
import { type ApiCategory, useCategories } from "../hooks/useCategories";

const EmptyCartModal = lazy(() =>
  import("./EmptyCartModal").then((module) => ({
    default: module.EmptyCartModal,
  })),
);
const GlobalSearchModal = lazy(() =>
  import("./GlobalSearchModal").then((module) => ({
    default: module.GlobalSearchModal,
  })),
);
const SupportModal = lazy(() =>
  import("./SupportModal").then((module) => ({
    default: module.SupportModal,
  })),
);

interface UnifiedHeaderProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
  onCategorySelect?: (category: string) => void;
  onLogout?: () => void;
  userName?: string;
  isTransparent?: boolean;
}

type HeaderCategory = {
  id: string;
  name: string;
  items: number;
  image: string;
};

function isActiveStatus(v: any) {
  // soporta data vieja: true/false o "active"/"inactive" o undefined => activo
  if (v === undefined || v === null) return true;
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "active";
}

function mapCategoryToHeader(c: ApiCategory): HeaderCategory | null {
  const id = (c?.id ?? "").toString().trim();
  const name = (c?.name ?? "").toString().trim();
  if (!id || !name) return null;

  if (!isActiveStatus((c as any)?.status)) return null;

  const imageRaw = (c?.imageUrl || c?.image || "").toString().trim();
  const image = imageRaw || DEFAULT_CATEGORY_IMAGE;

  const items = Number(c?.productCount ?? c?.items ?? 0);

  return {
    id,
    name,
    items: Number.isFinite(items) ? items : 0,
    image,
  };
}

export function UnifiedHeader({
  onNavigate,
  currentPage = "home",
  isLoggedIn = false,
  onCategorySelect,
  onLogout,
  userName: userNameProp = "User",
  isTransparent = true,
}: UnifiedHeaderProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { openLoginModal, openSignupModal } = useModal();
  const { cartCount } = useCart();
  const hasPendingOrders = useHasPendingOrders();

  const effectiveIsLoggedIn = isAuthenticated || isLoggedIn;
  const effectiveUserName = user?.fullName || userNameProp;

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [expandedMobileShop, setExpandedMobileShop] = useState(false);
  const [activeLink, setActiveLink] = useState(currentPage);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const {
    data: apiCategories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();

  // ✅ categories desde API compartida (SIN fallback)
  const categories = useMemo(
    () =>
      apiCategories
        .map(mapCategoryToHeader)
        .filter(Boolean) as HeaderCategory[],
    [apiCategories],
  );

  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const shopButtonRef = useRef<HTMLButtonElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const shopHoverCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const aboutHoverCloseTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (categoriesError) {
      console.warn("[UnifiedHeader] categories load failed");
    }
  }, [categoriesError]);

  // Sticky header on scroll
  useEffect(() => {
    if (!isTransparent) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransparent]);

  // Active link sync
  useEffect(() => {
    setActiveLink(currentPage);
  }, [currentPage]);

  // Touch device detect
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window || navigator.maxTouchPoints > 0,
      );
    };
    checkTouchDevice();
    window.addEventListener("touchstart", checkTouchDevice, { once: true });
    return () => window.removeEventListener("touchstart", checkTouchDevice);
  }, []);

  // Close dropdowns on outside click / ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shopDropdownRef.current &&
        !shopDropdownRef.current.contains(event.target as Node) &&
        shopButtonRef.current &&
        !shopButtonRef.current.contains(event.target as Node)
      ) {
        setIsShopDropdownOpen(false);
      }
      if (
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(event.target as Node) &&
        aboutButtonRef.current &&
        !aboutButtonRef.current.contains(event.target as Node)
      ) {
        setIsAboutDropdownOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node) &&
        accountButtonRef.current &&
        !accountButtonRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShopDropdownOpen(false);
        setIsAboutDropdownOpen(false);
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleNavigation = (page: string) => {
    setActiveLink(page);
    setIsMobileMenuOpen(false);
    setIsShopDropdownOpen(false);
    setIsAboutDropdownOpen(false);
    setIsAccountMenuOpen(false);
    if (onNavigate) onNavigate(page);
  };

  const handleCategoryClick = (categoryName: string) => {
    setIsShopDropdownOpen(false);
    setIsMobileMenuOpen(false);
    handleNavigation("shop");
    onCategorySelect?.(categoryName);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
    logout();
    onLogout?.();

    toast.success("Cerraste sesión correctamente", {
      description: "¡Hasta la próxima!",
      duration: 2000,
    });
  };

  const handleCartClick = () => {
    if (!effectiveIsLoggedIn) setShowEmptyCartModal(true);
    else handleNavigation("cart");
  };

  const handleSupportClick = () => {
    // 1) cerrar menú mobile si está abierto
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    // 2) cerrar dropdowns por las dudas
    setIsShopDropdownOpen(false);
    setIsAboutDropdownOpen(false);
    setIsAccountMenuOpen(false);

    // 3) abrir el modal en el siguiente frame (ya con el menú cerrado)
    requestAnimationFrame(() => {
      setShowSupportModal(true);
    });
  };

  // Shop dropdown handlers
  const handleShopClick = () => {
    if (shopHoverCloseTimer.current) {
      clearTimeout(shopHoverCloseTimer.current);
      shopHoverCloseTimer.current = null;
    }
    setIsShopDropdownOpen((v) => !v);
    setIsAboutDropdownOpen(false);
    setIsAccountMenuOpen(false);
  };

  const handleShopMouseEnter = () => {
    if (isTouchDevice) return;
    if (isShopDropdownOpen && shopHoverCloseTimer.current) {
      clearTimeout(shopHoverCloseTimer.current);
      shopHoverCloseTimer.current = null;
    }
  };

  const handleShopMouseLeave = () => {
    if (isTouchDevice) return;
    if (isShopDropdownOpen) {
      shopHoverCloseTimer.current = setTimeout(() => {
        setIsShopDropdownOpen(false);
      }, 300);
    }
  };

  const handleShopDropdownMouseEnter = () => {
    if (isTouchDevice) return;
    if (shopHoverCloseTimer.current) {
      clearTimeout(shopHoverCloseTimer.current);
      shopHoverCloseTimer.current = null;
    }
  };

  const handleShopDropdownMouseLeave = () => {
    if (isTouchDevice) return;
    shopHoverCloseTimer.current = setTimeout(() => {
      setIsShopDropdownOpen(false);
    }, 300);
  };

  // About dropdown handlers
  const handleAboutClick = () => {
    if (aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
    setIsAboutDropdownOpen((v) => !v);
    setIsShopDropdownOpen(false);
    setIsAccountMenuOpen(false);
  };

  const handleAccountMenuClick = () => {
    setIsAccountMenuOpen((v) => !v);
    setIsShopDropdownOpen(false);
    setIsAboutDropdownOpen(false);
  };

  const handleAboutMouseEnter = () => {
    if (isTouchDevice) return;
    if (isAboutDropdownOpen && aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
  };

  const handleAboutMouseLeave = () => {
    if (isTouchDevice) return;
    if (isAboutDropdownOpen) {
      aboutHoverCloseTimer.current = setTimeout(() => {
        setIsAboutDropdownOpen(false);
      }, 300);
    }
  };

  const handleAboutDropdownMouseEnter = () => {
    if (isTouchDevice) return;
    if (aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
  };

  const handleAboutDropdownMouseLeave = () => {
    if (isTouchDevice) return;
    aboutHoverCloseTimer.current = setTimeout(() => {
      setIsAboutDropdownOpen(false);
    }, 300);
  };

  const textColor = scrolled ? "text-[#0D0D0D]" : "text-white";
  const borderColor = scrolled ? "border-gray-200/50" : "border-white/10";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[5000] border-b transition-colors duration-150 ${
          scrolled ? "bg-white backdrop-blur-md" : "bg-transparent"
        } ${borderColor} ${
          scrolled ? "shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""
        }`}
        role="banner"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <button
              onClick={() => handleNavigation("home")}
              className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Ir a inicio"
            >
              <img
                src={
                  scrolled
                    ? "https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-orange.svg?alt=media&token=9ee36f7e-ee0d-4dba-9d7b-3af1688b8f94"
                    : "https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-white.svg?alt=media&token=9402edf6-17bc-463a-b233-2999af7158c5"
                }
                alt="HeyPoint! Logo"
                width={100}
                height={60}
                decoding="async"
                className="w-[80px] sm:w-[100px] h-auto transition-opacity duration-150"
              />
            </button>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-2"
              aria-label="Navegación principal"
            >
              <button
                onClick={() => handleNavigation("home")}
                className={`px-5 py-2 rounded-full transition-colors ${
                  activeLink === "home"
                    ? "bg-[#FF6B00] text-white"
                    : `${textColor} hover:bg-[#FF6B00]/10`
                }`}
                style={{ fontSize: "0.938rem", fontWeight: 500 }}
              >
                Inicio
              </button>

              {/* Shop Dropdown */}
              <div className="relative">
                <button
                  ref={shopButtonRef}
                  onClick={handleShopClick}
                  onMouseEnter={handleShopMouseEnter}
                  onMouseLeave={handleShopMouseLeave}
                  className={`px-5 py-2 rounded-full transition-colors inline-flex items-center gap-1.5 ${
                    activeLink === "shop" || isShopDropdownOpen
                      ? "bg-[#FF6B00] text-white"
                      : `${textColor} hover:bg-[#FF6B00]/10`
                  }`}
                  style={{ fontSize: "0.938rem", fontWeight: 500 }}
                  aria-expanded={isShopDropdownOpen}
                  aria-haspopup="true"
                >
                  Tienda
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isShopDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isShopDropdownOpen && (
                    <motion.div
                      ref={shopDropdownRef}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
                      onMouseEnter={handleShopDropdownMouseEnter}
                      onMouseLeave={handleShopDropdownMouseLeave}
                      className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-[700px] max-w-[90vw]"
                    >
                      <Card className="bg-white border-none shadow-2xl rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8534] px-6 py-4">
                          <h3
                            className="text-white"
                            style={{ fontSize: "1.25rem", fontWeight: 600 }}
                          >
                            Comprá por Categoría
                          </h3>
                        </div>

                        <div className="p-6 grid grid-cols-3 gap-4">
                          {categoriesLoading ? (
                            <div className="col-span-3 text-center text-[#2E2E2E]">
                              Cargando categorías...
                            </div>
                          ) : categories.length === 0 ? (
                            <div className="col-span-3 text-center text-[#2E2E2E]">
                              No hay categorías disponibles.
                            </div>
                          ) : (
                            categories.slice(0, 6).map((category) => (
                              <button
                                key={category.id}
                                onClick={() =>
                                  handleCategoryClick(category.name)
                                }
                                className="group text-left"
                              >
                                <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                                  <ImageWithFallback
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <div className="absolute bottom-2 left-2 right-2">
                                    <p
                                      className="text-white"
                                      style={{
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {category.name}
                                    </p>
                                    <p
                                      className="text-white/80"
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      {category.items}+ items
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                          <Button
                            onClick={() => {
                              setIsShopDropdownOpen(false);
                              handleNavigation("shop");
                            }}
                            className="w-full h-10 px-5 bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Ver todos los productos
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => handleNavigation("business")}
                className={`px-5 py-2 rounded-full transition-colors ${
                  activeLink === "business"
                    ? "bg-[#FF6B00] text-white"
                    : `${textColor} hover:bg-[#FF6B00]/10`
                }`}
                style={{ fontSize: "0.938rem", fontWeight: 500 }}
              >
                El Modelo HeyPoint
              </button>

              <button
                onClick={() => handleNavigation("contact")}
                className={`px-5 py-2 rounded-full transition-colors ${
                  activeLink === "contact"
                    ? "bg-[#FF6B00] text-white"
                    : `${textColor} hover:bg-[#FF6B00]/10`
                }`}
                style={{ fontSize: "0.938rem", fontWeight: 500 }}
              >
                Contacto
              </button>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleCartClick}
                className={`relative p-2 ${textColor} hover:text-[#FF6B00] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg`}
                aria-label={`Carrito con ${cartCount} productos`}
              >
                <ShoppingCart
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  aria-hidden="true"
                />
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1.5 bg-[#FF6B00] text-white border-none"
                    style={{ fontSize: "0.688rem", fontWeight: 600 }}
                  >
                    {cartCount}
                  </Badge>
                )}
              </button>

              <div className="hidden lg:flex items-center gap-3">
                {cartCount > 0 && (
                  <Button
                    onClick={handleCartClick}
                    className="h-10 px-5 rounded-full bg-[#FF6B00] hover:bg-[#e56000] text-white flex items-center gap-2 shadow-sm"
                    style={{ fontSize: "0.938rem", fontWeight: 600 }}
                    aria-label={`Ir a pagar, ${cartCount} ${cartCount === 1 ? "producto" : "productos"} en el carrito`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ir a pagar
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white/25 text-white" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {cartCount}
                    </span>
                  </Button>
                )}

                <Button
                  onClick={handleSupportClick}
                  className={`h-10 px-5 rounded-full transition-colors flex items-center justify-center gap-2 ${
                    scrolled
                      ? "bg-white border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6]"
                      : "bg-white/10 hover:bg-white/20 border border-white/40 text-white"
                  }`}
                  style={{ fontSize: "0.938rem", fontWeight: 500 }}
                  aria-label="Obtener ayuda"
                >
                  <HelpCircle className="w-4 h-4" />
                  ¿Necesitás ayuda?
                </Button>

                {effectiveIsLoggedIn ? (
                  <div className="relative">
                    <button
                      ref={accountButtonRef}
                      onClick={handleAccountMenuClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${textColor} hover:bg-[#FF6B00]/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                      aria-label="Menú de cuenta"
                      aria-haspopup="true"
                      aria-expanded={isAccountMenuOpen}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span style={{ fontSize: "0.938rem", fontWeight: 500 }}>
                        {effectiveUserName.split(" ")[0]}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-150 ${
                          isAccountMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isAccountMenuOpen && (
                      <div
                        ref={accountDropdownRef}
                        className="absolute right-0 mt-2 w-56 z-50"
                      >
                        <Card className="bg-white border-none shadow-xl rounded-2xl overflow-hidden p-2">
                          <button
                            onClick={() => handleNavigation("profile")}
                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#FFF4E6] text-[#2E2E2E] hover:text-[#FF6B00] transition-colors flex items-center gap-3"
                            style={{ fontSize: "0.938rem", fontWeight: 500 }}
                          >
                            <User className="w-4 h-4" />
                            Mi perfil
                          </button>

                        <button
                          onClick={() => handleNavigation("orders")}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#FFF4E6] text-[#2E2E2E] hover:text-[#FF6B00] transition-colors flex items-center gap-3"
                          style={{ fontSize: "0.938rem", fontWeight: 500 }}
                        >
                          <Package className="w-4 h-4" />
                          <span className="flex items-center gap-2">
                            Mis pedidos
                            {hasPendingOrders && (
                              <span className="w-2 h-2 bg-[#FF6B00] rounded-full" />
                            )}
                          </span>
                        </button>

                        <div className="border-t border-gray-100 my-2"></div>

                        <button
                          onClick={handleLogoutClick}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors flex items-center gap-3"
                          style={{ fontSize: "0.938rem", fontWeight: 500 }}
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={openLoginModal}
                    className={`h-10 px-6 rounded-full transition-colors ${
                      scrolled
                        ? "bg-[#FF6B00] hover:bg-[#e56000] text-white"
                        : "bg-white/10 hover:bg-white/20 border border-white/40 text-white"
                    }`}
                    style={{ fontSize: "0.938rem", fontWeight: 500 }}
                  >
                    Iniciar sesión
                  </Button>
                )}
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 ${textColor} hover:text-[#FF6B00] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg`}
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[7000] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.aside
              initial={shouldReduceMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-sm bg-white z-[8000] lg:hidden overflow-y-auto shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Menú móvil"
            >
              {/* Header del drawer */}
              <div className="sticky top-0 bg-white z-10 border-b border-gray-200/60">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-orange.svg?alt=media&token=9ee36f7e-ee0d-4dba-9d7b-3af1688b8f94"
                      alt="HeyPoint"
                      width={100}
                      height={60}
                      loading="lazy"
                      decoding="async"
                      className="w-[92px] h-auto"
                    />
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X className="w-6 h-6 text-[#1C2335]" />
                  </button>
                </div>

                {/* Bloque usuario */}
                <div className="px-5 pb-5">
                  {effectiveIsLoggedIn ? (
                    <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-[#FFF8F0] to-white p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-[#1C2335] truncate"
                            style={{ fontSize: "0.95rem", fontWeight: 700 }}
                          >
                            {effectiveUserName}
                          </p>
                          <p className="text-sm text-[#2E2E2E]/60">Mi cuenta</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleNavigation("profile")}
                          className="h-11 px-5 rounded-full bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
                          style={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Perfil
                        </Button>

                        <Button
                          onClick={() => handleNavigation("orders")}
                          className="h-11 px-5 rounded-full bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
                          style={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Pedidos
                          {hasPendingOrders && (
                            <span className="ml-2 w-2 h-2 bg-[#FF6B00] rounded-full inline-block" />
                          )}
                        </Button>
                      </div>

                      <button
                        onClick={handleLogoutClick}
                        className="mt-3 w-full h-11 px-5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        style={{ fontSize: "0.9rem", fontWeight: 700 }}
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-[#FFF8F0] to-white p-4">
                      <p
                        className="text-[#1C2335]"
                        style={{ fontSize: "0.95rem", fontWeight: 700 }}
                      >
                        Iniciá sesión para comprar
                      </p>
                      <p className="text-sm text-[#2E2E2E]/60 mt-1">
                        Guardá tu carrito y revisá tus pedidos.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            openLoginModal();
                          }}
                          className="h-11 px-5 rounded-full bg-[#FF6B00] hover:bg-[#e56000] text-white"
                          style={{ fontSize: "0.9rem", fontWeight: 700 }}
                        >
                          Ingresar
                        </Button>

                        <Button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            openSignupModal();
                          }}
                          className="h-11 px-5 rounded-full bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
                          style={{ fontSize: "0.9rem", fontWeight: 700 }}
                        >
                          Crear cuenta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="p-5">
                <div className="space-y-2">
                  <button
                    onClick={() => handleNavigation("home")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                      activeLink === "home"
                        ? "bg-[#FFF4E6] text-[#FF6B00]"
                        : "hover:bg-gray-50 text-[#1C2335]"
                    }`}
                    style={{ fontSize: "0.98rem", fontWeight: 700 }}
                  >
                    <Home className="w-5 h-5" />
                    Inicio
                  </button>

                  {/* Tienda (acordeón) */}
                  <button
                    onClick={() => setExpandedMobileShop((v) => !v)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
                      activeLink === "shop" || expandedMobileShop
                        ? "bg-[#FFF4E6] text-[#FF6B00]"
                        : "hover:bg-gray-50 text-[#1C2335]"
                    }`}
                    style={{ fontSize: "0.98rem", fontWeight: 700 }}
                    aria-expanded={expandedMobileShop}
                  >
                    <span className="flex items-center gap-3">
                      <Store className="w-5 h-5" />
                      Tienda
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedMobileShop ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedMobileShop && (
                      <div>
                        <div className="mt-2 ml-2 pl-3 border-l border-[#FF6B00]/20 space-y-2">
                          <button
                            onClick={() => handleNavigation("shop")}
                            className="w-full text-left px-4 py-3 rounded-2xl hover:bg-gray-50 text-[#1C2335] flex items-center gap-3"
                            style={{ fontSize: "0.95rem", fontWeight: 700 }}
                          >
                            <Store className="w-4 h-4 text-[#FF6B00]" />
                            Ver todos los productos
                          </button>

                          {/* categorías */}
                          <div className="grid grid-cols-1 gap-2">
                            {categoriesLoading ? (
                              <div className="px-4 py-3 text-sm text-[#2E2E2E]/70">
                                Cargando categorías...
                              </div>
                            ) : categories.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-[#2E2E2E]/70">
                                No hay categorías disponibles.
                              </div>
                            ) : (
                              categories.slice(0, 8).map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => handleCategoryClick(cat.name)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-[#1C2335]"
                                  style={{
                                    fontSize: "0.93rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#FFF4E6] flex-shrink-0">
                                    <ImageWithFallback
                                      src={cat.image}
                                      alt={cat.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate">{cat.name}</p>
                                    <p className="text-xs text-[#2E2E2E]/50">
                                      {cat.items}+ items
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  <button
                    onClick={() => handleNavigation("business")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                      activeLink === "business"
                        ? "bg-[#FFF4E6] text-[#FF6B00]"
                        : "hover:bg-gray-50 text-[#1C2335]"
                    }`}
                    style={{ fontSize: "0.98rem", fontWeight: 700 }}
                  >
                    <Info className="w-5 h-5" />
                    El Modelo HeyPoint
                  </button>

                  <button
                    onClick={() => handleNavigation("contact")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                      activeLink === "contact"
                        ? "bg-[#FFF4E6] text-[#FF6B00]"
                        : "hover:bg-gray-50 text-[#1C2335]"
                    }`}
                    style={{ fontSize: "0.98rem", fontWeight: 700 }}
                  >
                    <Mail className="w-5 h-5" />
                    Contacto
                  </button>
                </div>

                {/* Acciones inferiores */}
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleSupportClick}
                    className="w-full h-12 px-5 rounded-full bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6] flex items-center justify-center gap-2"
                    style={{ fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    <HelpCircle className="w-5 h-5 text-[#FF6B00]" />
                    ¿Necesitás ayuda?
                  </Button>

                  <Button
                    onClick={handleCartClick}
                    className="w-full h-12 px-5 rounded-full bg-[#FF6B00] hover:bg-[#e56000] text-white flex items-center justify-center gap-2"
                    style={{ fontSize: "0.95rem", fontWeight: 800 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 ? "Ir a pagar" : "Ir al carrito"}
                    {cartCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-white/20">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </div>

                <div className="mt-6 text-center text-xs text-[#2E2E2E]/50">
                  © {new Date().getFullYear()} HeyPoint
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {showEmptyCartModal && (
          <EmptyCartModal
            isOpen={showEmptyCartModal}
            onClose={() => setShowEmptyCartModal(false)}
            onSignIn={() => {
              setShowEmptyCartModal(false);
              openLoginModal();
            }}
            onSignUp={() => {
              setShowEmptyCartModal(false);
              openSignupModal();
            }}
          />
        )}

        {showGlobalSearchModal && (
          <GlobalSearchModal
            isOpen={showGlobalSearchModal}
            onClose={() => setShowGlobalSearchModal(false)}
            onNavigate={onNavigate}
            onCategorySelect={onCategorySelect}
          />
        )}

        {showSupportModal && (
          <SupportModal
            isOpen={showSupportModal}
            onClose={() => setShowSupportModal(false)}
            onNavigate={onNavigate}
          />
        )}
      </Suspense>
    </>
  );
}
