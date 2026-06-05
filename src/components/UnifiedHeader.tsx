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
import { Card } from "./ui/card";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useCart } from "../contexts/CartContext";
import { useHasPendingOrders } from "../hooks/useHasPendingOrders";
import { toast } from "sonner";

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

export function UnifiedHeader({
  onNavigate,
  currentPage = "home",
  isLoggedIn = false,
  onLogout,
  userName: userNameProp = "User",
  isTransparent = true,
}: UnifiedHeaderProps) {
  const { isAuthenticated, user, customerFullName, logout } = useAuth();
  const { openLoginModal, openSignupModal } = useModal();
  const { cartCount } = useCart();
  const hasPendingOrders = useHasPendingOrders();

  const effectiveIsLoggedIn = isAuthenticated || isLoggedIn;
  const effectiveUserName = user?.fullName || userNameProp;

  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(currentPage);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const aboutHoverCloseTimer = useRef<NodeJS.Timeout | null>(null);

  // Sticky header on scroll
  useEffect(() => {
    if (!isTransparent) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransparent]);

  // Active link sync
  useEffect(() => {
    setActiveLink(currentPage);
  }, [currentPage]);

  // Close dropdowns on outside click / ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    setIsAboutDropdownOpen(false);
    setIsAccountMenuOpen(false);
    if (onNavigate) onNavigate(page);
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
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    setIsAboutDropdownOpen(false);
    setIsAccountMenuOpen(false);
    requestAnimationFrame(() => {
      setShowSupportModal(true);
    });
  };

  const handleAboutClick = () => {
    if (aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
    setIsAboutDropdownOpen((v) => !v);
    setIsAccountMenuOpen(false);
  };

  const handleAccountMenuClick = () => {
    setIsAccountMenuOpen((v) => !v);
    setIsAboutDropdownOpen(false);
  };

  const handleAboutMouseEnter = () => {
    if (isAboutDropdownOpen && aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
  };

  const handleAboutMouseLeave = () => {
    if (isAboutDropdownOpen) {
      aboutHoverCloseTimer.current = setTimeout(() => {
        setIsAboutDropdownOpen(false);
      }, 300);
    }
  };

  const handleAboutDropdownMouseEnter = () => {
    if (aboutHoverCloseTimer.current) {
      clearTimeout(aboutHoverCloseTimer.current);
      aboutHoverCloseTimer.current = null;
    }
  };

  const handleAboutDropdownMouseLeave = () => {
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
                alt="Hey!Point Logo"
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

              {/* Tienda — plain nav link, category browsing happens inside ShopPage */}
              <button
                onClick={() => handleNavigation("shop")}
                className={`px-5 py-2 rounded-full transition-colors ${
                  activeLink === "shop"
                    ? "bg-[#FF6B00] text-white"
                    : `${textColor} hover:bg-[#FF6B00]/10`
                }`}
                style={{ fontSize: "0.938rem", fontWeight: 500 }}
              >
                Tienda
              </button>

              <button
                onClick={() => handleNavigation("business")}
                className={`px-5 py-2 rounded-full transition-colors ${
                  activeLink === "business"
                    ? "bg-[#FF6B00] text-white"
                    : `${textColor} hover:bg-[#FF6B00]/10`
                }`}
                style={{ fontSize: "0.938rem", fontWeight: 500 }}
              >
                El Modelo Hey!Point
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
              {/* Cart icon — visible on all sizes only when cart is empty */}
              {cartCount === 0 && (
                <button
                  onClick={handleCartClick}
                  className={`relative p-2 ${textColor} hover:text-[#FF6B00] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg`}
                  aria-label="Carrito vacío"
                >
                  <ShoppingCart
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    aria-hidden="true"
                  />
                </button>
              )}

              {/* Mobile "Pagar" pill — only on small screens when cart has items */}
              {cartCount > 0 && (
                <button
                  onClick={handleCartClick}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#e56000] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] transition-colors"
                  aria-label={`Pagar, ${cartCount} ${cartCount === 1 ? "producto" : "productos"} en el carrito`}
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}
                >
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                  Pagar
                  <span
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white/25"
                    style={{ fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    {cartCount}
                  </span>
                </button>
              )}

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
                  <img
                    src="https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-orange.svg?alt=media&token=9ee36f7e-ee0d-4dba-9d7b-3af1688b8f94"
                    alt="Hey!Point"
                    width={100}
                    height={60}
                    loading="lazy"
                    decoding="async"
                    className="w-[92px] h-auto"
                  />
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

                  {/* Tienda — plain navigation, category browsing happens inside ShopPage */}
                  <button
                    onClick={() => handleNavigation("shop")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                      activeLink === "shop"
                        ? "bg-[#FFF4E6] text-[#FF6B00]"
                        : "hover:bg-gray-50 text-[#1C2335]"
                    }`}
                    style={{ fontSize: "0.98rem", fontWeight: 700 }}
                  >
                    <Store className="w-5 h-5" />
                    Tienda
                  </button>

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
                    El Modelo Hey!Point
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
                  © {new Date().getFullYear()} Hey!Point
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
            onCategorySelect={undefined}
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


