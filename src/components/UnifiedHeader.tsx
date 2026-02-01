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
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyCartModal } from "./EmptyCartModal";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { SupportModal } from "./SupportModal";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { useCart } from "../contexts/CartContext";
import { useHasPendingOrders } from "../hooks/useHasPendingOrders";
import { toast } from "sonner";
import { CategoriesAPI } from "../lib/api"; // ✅ tu api.ts

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

type ApiCategory = {
  id?: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  imagePath?: string;
  items?: number;
  productCount?: number;
  status?: "active" | "inactive" | boolean;
};

type HeaderCategory = {
  id: string;
  name: string;
  items: number;
  image: string;
};

const FALLBACK_CATEGORIES: HeaderCategory[] = [
  {
    id: "snacks",
    name: "Snacks",
    items: 120,
    image:
      "https://images.unsplash.com/photo-1762417582697-f17df0c69348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmFja3MlMjBkaXNwbGF5JTIwc2hlbGZ8ZW58MXx8fHwxNzYzMDg4OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "beverages",
    name: "Beverages",
    items: 90,
    image:
      "https://images.unsplash.com/photo-1672826979189-faae44e1b7a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXZlcmFnZXMlMjBkcmlua3MlMjBjb29sZXJ8ZW58MXx8fHwxNzYzMDg4OTk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "electronics",
    name: "Electronics",
    items: 45,
    image:
      "https://images.unsplash.com/photo-1707485122968-56916bd2c464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMGdhZGdldHMlMjBkaXNwbGF5fGVufDF8fHx8MTc2MzA4ODk5NHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    items: 110,
    image:
      "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb25hbCUyMGNhcmUlMjBwcm9kdWN0c3xlbnwxfHx8fDE3NjMwODkwMTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "frozen-foods",
    name: "Frozen Foods",
    items: 75,
    image:
      "https://images.unsplash.com/photo-1651383140368-9b3ee59c2981?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcm96ZW4lMjBmb29kfGVufDF8fHx8MTc2MjIzNDM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "bakery",
    name: "Bakery",
    items: 65,
    image:
      "https://images.unsplash.com/photo-1674770067314-296af21ad811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlcnklMjBicmVhZHxlbnwxfHx8fDE3NjIyMjM3OTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const DEFAULT_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=1200&q=80";

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
  const [expandedMobileShop, setExpandedMobileShop] = useState(false);
  const [activeLink, setActiveLink] = useState(currentPage);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // ✅ categories desde API (con fallback)
  const [categories, setCategories] =
    useState<HeaderCategory[]>(FALLBACK_CATEGORIES);

  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const shopButtonRef = useRef<HTMLButtonElement>(null);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const shopHoverCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const aboutHoverCloseTimer = useRef<NodeJS.Timeout | null>(null);

  // ✅ Cargar categorías públicas (GET /api/categories)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await CategoriesAPI.getAll(); // ✅ /categories (baseURL ya incluye /api)
        const raw = Array.isArray(res.data) ? (res.data as ApiCategory[]) : [];

        const mapped = raw
          .map(mapCategoryToHeader)
          .filter(Boolean) as HeaderCategory[];

        if (!mounted) return;
        if (mapped.length > 0) {
          setCategories(mapped);
        } else {
          // si viene vacío, mantené fallback (pero loguea para debug)
          console.warn("[UnifiedHeader] categories empty from API");
        }
      } catch (e) {
        console.warn("[UnifiedHeader] categories load failed:", e);
        // se queda con fallback
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsShopDropdownOpen(false);
        setIsAboutDropdownOpen(false);
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

  const handleSupportClick = () => setShowSupportModal(true);

  // Shop dropdown handlers
  const handleShopClick = () => {
    if (shopHoverCloseTimer.current) {
      clearTimeout(shopHoverCloseTimer.current);
      shopHoverCloseTimer.current = null;
    }
    setIsShopDropdownOpen((v) => !v);
    setIsAboutDropdownOpen(false);
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
      <motion.header
        initial={false}
        animate={{
          backgroundColor: scrolled ? "#FFFFFF" : "rgba(255, 255, 255, 0)",
          backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-[5000] border-b ${borderColor} ${
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
                className="w-[80px] sm:w-[100px] h-auto transition-all duration-300"
              />
            </button>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center gap-2"
              aria-label="Navegación principal"
            >
              <button
                onClick={() => handleNavigation("home")}
                className={`px-5 py-2 rounded-full transition-all ${
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
                  className={`px-5 py-2 rounded-full transition-all inline-flex items-center gap-1.5 ${
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
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
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
                          {categories.slice(0, 6).map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryClick(category.name)}
                              className="group text-left"
                            >
                              <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                                <ImageWithFallback
                                  src={category.image}
                                  alt={category.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                          ))}
                        </div>

                        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                          <Button
                            onClick={() => {
                              setIsShopDropdownOpen(false);
                              handleNavigation("shop");
                            }}
                            className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-xl h-10"
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
                className={`px-5 py-2 rounded-full transition-all ${
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
                className={`px-5 py-2 rounded-full transition-all ${
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
              <motion.button
                onClick={handleCartClick}
                className={`relative p-2 ${textColor} hover:text-[#FF6B00] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              </motion.button>

              <div className="hidden lg:flex items-center gap-3">
                <Button
                  onClick={handleSupportClick}
                  className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
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
                  <div className="relative group">
                    <motion.button
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${textColor} hover:bg-[#FF6B00]/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label="Menú de cuenta"
                      aria-haspopup="true"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span style={{ fontSize: "0.938rem", fontWeight: 500 }}>
                        {effectiveUserName.split(" ")[0]}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </motion.button>

                    <div className="absolute right-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
                  </div>
                ) : (
                  <Button
                    onClick={openLoginModal}
                    className={`px-5 py-2 rounded-full transition-all ${
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

              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-2 ${textColor} hover:text-[#FF6B00] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] rounded-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[4900] lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[88vw] max-w-sm bg-white z-[5000] lg:hidden overflow-y-auto shadow-2xl"
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
                          className="h-11 rounded-xl bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
                          style={{ fontSize: "0.9rem", fontWeight: 600 }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Perfil
                        </Button>

                        <Button
                          onClick={() => handleNavigation("orders")}
                          className="h-11 rounded-xl bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
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
                        className="mt-3 w-full h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
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
                          className="h-11 rounded-xl bg-[#FF6B00] hover:bg-[#e56000] text-white"
                          style={{ fontSize: "0.9rem", fontWeight: 700 }}
                        >
                          Ingresar
                        </Button>

                        <Button
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            openSignupModal();
                          }}
                          className="h-11 rounded-xl bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6]"
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

                  <AnimatePresence initial={false}>
                    {expandedMobileShop && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
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
                            {categories.slice(0, 8).map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.name)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-[#1C2335]"
                                style={{ fontSize: "0.93rem", fontWeight: 600 }}
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
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                    className="w-full h-12 rounded-2xl bg-white border border-gray-200 text-[#1C2335] hover:bg-[#FFF4E6] flex items-center justify-center gap-2"
                    style={{ fontSize: "0.95rem", fontWeight: 700 }}
                  >
                    <HelpCircle className="w-5 h-5 text-[#FF6B00]" />
                    ¿Necesitás ayuda?
                  </Button>

                  <Button
                    onClick={handleCartClick}
                    className="w-full h-12 rounded-2xl bg-[#FF6B00] hover:bg-[#e56000] text-white flex items-center justify-center gap-2"
                    style={{ fontSize: "0.95rem", fontWeight: 800 }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Ir al carrito
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

      <GlobalSearchModal
        isOpen={showGlobalSearchModal}
        onClose={() => setShowGlobalSearchModal(false)}
        onNavigate={onNavigate}
        onCategorySelect={onCategorySelect}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </>
  );
}
