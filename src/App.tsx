import { lazy, Suspense, useState, useEffect, useMemo, useRef } from "react";
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
import { toast } from "sonner";
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
import { CookieBanner } from "./components/CookieBanner";
import { ShopPage } from "./pages/ShopPage";
import { useCategories } from "./hooks/useCategories";

const ProductDetailsPage = lazy(() =>
  import("./pages/ProductDetailsPage").then((module) => ({
    default: module.ProductDetailsPage,
  })),
);
const ContactPage = lazy(() =>
  import("./pages/ContactPage").then((module) => ({
    default: module.ContactPage,
  })),
);
const BusinessPage = lazy(() =>
  import("./pages/BusinessPage").then((module) => ({
    default: module.BusinessPage,
  })),
);
const OurCompanyPage = lazy(() =>
  import("./pages/OurCompanyPage").then((module) => ({
    default: module.OurCompanyPage,
  })),
);
const UserProfilePage = lazy(() =>
  import("./pages/UserProfilePage").then((module) => ({
    default: module.UserProfilePage,
  })),
);
const ShoppingCartPage = lazy(() =>
  import("./pages/ShoppingCartPage").then((module) => ({
    default: module.ShoppingCartPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const PurchaseSuccessPage = lazy(() =>
  import("./pages/PurchaseSuccessPage").then((module) => ({
    default: module.PurchaseSuccessPage,
  })),
);
const MyOrdersPage = lazy(() =>
  import("./pages/MyOrdersPage").then((module) => ({
    default: module.MyOrdersPage,
  })),
);
const TermsPage = lazy(() =>
  import("./pages/TermsPage").then((module) => ({
    default: module.TermsPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("./pages/PrivacyPage").then((module) => ({
    default: module.PrivacyPage,
  })),
);
const CookiesPage = lazy(() =>
  import("./pages/CookiesPage").then((module) => ({
    default: module.CookiesPage,
  })),
);

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
  | "privacy"
  | "cookies";

/**
 * ✅ Product actualizado para buscador/Firestore
 * - id: string (no number)
 */
interface Product {
  id: string;
  // Firestore product document ID used for cart/order stock operations.
  backendId?: string;
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

// ✅ HERO banner (Home) - para evitar flash/CLS
const HERO_SRC =
  "/images/bg-banner-hey-point-II.png";

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

function PageFallback() {
  return <div className="min-h-screen bg-[#FFF4E6]" />;
}

/** =========================
 * ✅ URL <-> Page (SPA routing simple)
 * ========================= */
function pageToPath(page: Page) {
  switch (page) {
    case "home":
      return "/";
    case "shop":
      return "/tienda";
    case "business":
      return "/modelo";
    case "contact":
      return "/contacto";
    case "cart":
      return "/carrito";
    case "checkout":
      return "/checkout";
    case "orders":
      return "/orders";
    case "profile":
      return "/account";
    case "terms":
      return "/terminos";
    case "privacy":
      return "/privacidad";
    case "cookies":
      return "/cookies";
    // productDetails y success no tienen ruta estable en este MVP
    default:
      return "/";
  }
}

function pathToPage(pathname: string): Page {
  const p = (pathname || "/").toLowerCase();

  if (p === "/" || p === "/home") return "home";
  if (p.startsWith("/tienda")) return "shop";
  if (p.startsWith("/modelo")) return "business";
  if (p.startsWith("/contacto")) return "contact";
  if (p.startsWith("/carrito") || p.startsWith("/cart")) return "cart";
  if (p.startsWith("/checkout")) return "checkout";
  if (p.startsWith("/orders")) return "orders";
  if (p.startsWith("/account") || p.startsWith("/profile")) return "profile";
  if (p.startsWith("/terminos")) return "terms";
  if (p.startsWith("/privacidad")) return "privacy";
  if (p.startsWith("/cookies")) return "cookies";

  return "home";
}

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <CartProvider>
          <Toaster position="top-right" />
          <ModalRoot />
          <GlobalModalBridge />
          <CookieBanner />
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
  const [lastOrder, setLastOrder] = useState<{
    id: string;
    orderId: string;
    pickupToken: string;
  } | null>(null);

  // ✅ Hero image loading (evita salto/flash al entrar por primera vez)
  const [heroLoaded, setHeroLoaded] = useState(false);

  // ✅ Preload banner para primera visita
  useEffect(() => {
    let alive = true;

    const img = new Image();
    img.decoding = "async";
    img.src = HERO_SRC;

    img.onload = () => {
      if (!alive) return;
      setHeroLoaded(true);
    };

    img.onerror = () => {
      if (!alive) return;
      // ✅ si falla, no te deja el hero “negro”
      setHeroLoaded(true);
    };

    return () => {
      alive = false;
    };
  }, []);

  // ✅ categorías API
  // Use contexts
  const {
    user,
    login,
    loadingAuth,
    currentUser,
    refreshEmailVerification,
    fetchMe,
    getAuthToken,
  } = useAuth();
  const { loginOpen, signupOpen, openLoginModal, openSignupModal, closeAllModals, openedAt } =
    useModal();
  const { clearCart } = useCart();
  const promptedIncompleteProfileUidRef = useRef<string | null>(null);

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

  // ✅ (1) Al iniciar: leer URL actual + soportar back/forward
  useEffect(() => {
    const applyFromUrl = () => {
      const page = pathToPage(window.location.pathname);
      setCurrentPage(page);
    };

    applyFromUrl();

    const onPopState = () => applyFromUrl();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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
        // ✅ también sincroniza URL
        window.history.pushState({}, "", "/account");
        setCurrentPage("profile");
      } else if (path === "/orders") {
        window.history.pushState({}, "", "/orders");
        setCurrentPage("orders");
      } else if (path === "/cart") {
        window.history.pushState({}, "", "/carrito");
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
      // Logout must leave protected/account states cleanly.
      localStorage.removeItem("heypoint_pending_profile");
      localStorage.removeItem("heypoint_pending_email");
      localStorage.removeItem("heypoint_pending_name");
      promptedIncompleteProfileUidRef.current = null;
      closeAllModals();
      setCurrentPage("home");
      if (window.location.pathname !== "/") {
        window.history.pushState({}, "", "/");
      }

    };

    window.addEventListener("heypoint:logout", handleLogout);
    return () => window.removeEventListener("heypoint:logout", handleLogout);
  }, [loadingAuth, closeAllModals]);

  useEffect(() => {
    if (loadingAuth || currentUser) return;
    if (currentPage !== "profile" && currentPage !== "orders") return;

    closeAllModals();
    setCurrentPage("home");
    if (window.location.pathname !== "/") {
      window.history.replaceState({}, "", "/");
    }
  }, [loadingAuth, currentUser, currentPage, closeAllModals]);

  useEffect(() => {
    if (loadingAuth || !currentUser) return;
    if (loginOpen || signupOpen) return;
    if (currentUser.emailVerified === false) return;
    if (localStorage.getItem("heypoint_pending_profile") === "1") return;
    if (promptedIncompleteProfileUidRef.current === currentUser.uid) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") return;

    let cancelled = false;

    async function promptIncompleteProfileAfterLogin() {
      try {
        const me = await fetchMe();
        const profile = me.profile;
        if (cancelled || profile?.profileComplete !== false) return;

        promptedIncompleteProfileUidRef.current = currentUser.uid;
        localStorage.setItem("heypoint_pending_profile", "1");
        localStorage.setItem(
          "heypoint_pending_email",
          profile.email || currentUser.email || "",
        );
        localStorage.setItem(
          "heypoint_pending_name",
          profile.fullName || currentUser.displayName || "",
        );
        openSignupModal();
      } catch (error) {
        console.error("[App] incomplete profile check after login failed", {
          uid: currentUser.uid,
          email: currentUser.email,
          error,
        });
      }
    }

    promptIncompleteProfileAfterLogin();

    return () => {
      cancelled = true;
    };
  }, [loadingAuth, currentUser, fetchMe, openSignupModal, loginOpen, signupOpen]);

  useEffect(() => {
    if (loadingAuth || !currentUser) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") !== "1") return;

    let cancelled = false;

    async function handleVerifiedRedirect() {
      try {
        const verified = await refreshEmailVerification();
        await getAuthToken(true);
        const me = await fetchMe();
        const profile = me.profile;

        if (!cancelled && verified && profile?.profileComplete === false) {
          promptedIncompleteProfileUidRef.current = currentUser.uid;
          localStorage.setItem("heypoint_pending_profile", "1");
          localStorage.setItem(
            "heypoint_pending_email",
            profile.email || currentUser?.email || "",
          );
          localStorage.setItem(
            "heypoint_pending_name",
            profile.fullName || currentUser?.displayName || "",
          );
          openSignupModal();
        }
      } catch (error) {
        console.error("[App] verified redirect handling failed", {
          uid: currentUser?.uid,
          email: currentUser?.email,
          error,
        });
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("verified");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }
      }
    }

    handleVerifiedRedirect();

    return () => {
      cancelled = true;
    };
  }, [
    loadingAuth,
    currentUser,
    refreshEmailVerification,
    getAuthToken,
    fetchMe,
    openSignupModal,
  ]);

  // ── Email-change callback (?emailChanged=1) ──────────────────────────────
  // Firebase redirects here after the user clicks the verification link sent
  // by verifyBeforeUpdateEmail(). We need to reload the Firebase Auth state
  // so currentUser.email reflects the new email, refresh the ID token, and
  // give the user clear feedback.
  //
  // Works in TWO scenarios:
  //  A) Same browser — user clicked the link in the same browser where the
  //     app was open. The modal (ChangeEmailModal) may or may not have auto-
  //     detected the change. We normalise here regardless.
  //  B) Different browser/device — no active Firebase session. We just show
  //     a toast telling the user to log in with the new email.
  useEffect(() => {
    if (loadingAuth) return; // wait for auth to initialise

    const params = new URLSearchParams(window.location.search);
    if (params.get("emailChanged") !== "1") return;

    // Remove param from URL immediately so it doesn't re-fire on re-renders
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("emailChanged");
    window.history.replaceState(
      {},
      "",
      `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
    );

    let cancelled = false;

    async function handleEmailChangedCallback() {
      if (currentUser) {
        try {
          // Reload Firebase user so .email and .emailVerified are up-to-date
          await refreshEmailVerification();
          // Force-refresh the ID token so the backend gets the new email claim
          await getAuthToken(true);
        } catch (err) {
          console.error("[App] emailChanged reload failed", err);
        }

        if (cancelled) return;

        toast.success("¡Correo actualizado!", {
          description:
            "Tu correo electrónico fue actualizado correctamente.",
          duration: 5000,
        });

        // Navigate to profile so the user sees their updated email
        window.history.pushState({}, "", "/account");
        setCurrentPage("profile");
      } else {
        // Different browser / no active session
        toast.success("Correo actualizado", {
          description:
            "Tu correo fue verificado. Iniciá sesión con tu nuevo correo.",
          duration: 8000,
        });
      }
    }

    handleEmailChangedCallback();

    return () => {
      cancelled = true;
    };
  }, [
    loadingAuth,
    currentUser,
    refreshEmailVerification,
    getAuthToken,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** =========================
   * Home categories
   * ========================= */
  const PLACEHOLDER_IMG = "https://placehold.co/600x400?text=Hey!Point";


  const {
    data: sharedCategories = [],
    isLoading: loadingCategories,
    isError: categoriesError,
  } = useCategories();

  const homeCategories = useMemo<UiCategory[]>(
    () =>
      sharedCategories
        .filter((c) => c.status !== "inactive")
        .map((c) => ({
          id: c.id,
          name: c.name,
          items: Number(c.productCount ?? c.items ?? 0),
          image: c.imageUrl || c.image || PLACEHOLDER_IMG,
        })),
    [sharedCategories],
  );
  const showCategorySkeletons = loadingCategories;
  const showCategoryEmptyState =
    !loadingCategories && (categoriesError || homeCategories.length === 0);
  const categorySkeletonItems = Array.from({ length: 4 });

  const howItWorksSteps = [
    {
      icon: <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Seleccioná tus productos",
      description:
        "Explorá la tienda y elegí los productos para tu compra. ¡Están separados por módulos!",
    },
    {
      icon: <CreditCard className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Pagá de forma rápida y segura",
      description:
        "Tus datos están protegidos y encriptados. Pagá y recibí en tu correo el código único que te permitirá retirar tus productos.",
    },
    {
      icon: <QrCode className="w-10 h-10 sm:w-12 sm:h-12" />,
      title: "Retirá tu compra!",
      description:
        "Ingresá tu código token en la pantalla que se encuentra en el stand. Se desbloqueará tu compra según el módulo que corresponda.",
    },
  ];

  const benefits = [
    {
      icon: <Zap className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Sin filas ni intermediarios.",
      description: "Compra cuando quieras, sin esperas y sin intermediarios.",
    },
    {
      icon: <Clock className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Disponible 24/7",
      description:
        "Hey!Point Se encuentra funcionando las 24 hs con productos personalizados para tu comunidad.",
    },
    {
      icon: <CreditCard className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Pagos Seguros",
      description:
        "Tus datos están protegidos y encriptados. Trabajamos con billetera virtual de Mercado Pago.",
    },
    {
      icon: <Shield className="w-7 h-7 sm:w-8 sm:h-8" />,
      title: "Retiro seguro",
      description:
        "Una vez realizado el pago, recibirás un código token en tu correo registrado. Este te servirá para retirar tu pedido en el stand.",
    },
  ];

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage("productDetails");
    // (MVP) no cambiamos URL aquí para no romper
  };

  const handleBackToShop = () => {
    setCurrentPage("shop");
    if (window.location.pathname !== "/tienda") {
      window.history.pushState({}, "", "/tienda");
    }
  };

  // ✅ (2) navegación interna = setState + pushState
  const handleNavigation = (page: string) => {
    const next = page as Page;
    setCurrentPage(next);

    if (next !== "shop") {
      setSelectedCategory(null);
      setSearchQuery("");
    }

    const nextPath = pageToPath(next);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage("shop");
    if (window.location.pathname !== "/tienda") {
      window.history.pushState({}, "", "/tienda");
    }
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
    // (MVP) success sin URL
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
      <Suspense fallback={<PageFallback />}>
        <ProductDetailsPage
          product={selectedProduct}
          onBack={handleBackToShop}
          onNavigate={handleNavigation}
          onProductClick={handleProductClick}
        />
      </Suspense>
    );
  }

  if (currentPage === "contact")
    return (
      <Suspense fallback={<PageFallback />}>
        <ContactPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "business")
    return (
      <Suspense fallback={<PageFallback />}>
        <BusinessPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "ourcompany")
    return (
      <Suspense fallback={<PageFallback />}>
        <OurCompanyPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "profile")
    return (
      <Suspense fallback={<PageFallback />}>
        <UserProfilePage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "cart")
    return (
      <Suspense fallback={<PageFallback />}>
        <ShoppingCartPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "checkout")
    return (
      <Suspense fallback={<PageFallback />}>
        <CheckoutPage
          onNavigate={handleNavigation}
          onOrderSuccess={(data) => setLastOrder(data)}
        />
      </Suspense>
    );

  if (currentPage === "success") {
    return (
      <Suspense fallback={<PageFallback />}>
        <PurchaseSuccessPage
          onNavigate={handleNavigation}
          userEmail={userEmail}
          userName={userName}
          pickupCode={lastOrder?.pickupToken ?? pickupCodeGenerated}
          orderId={lastOrder?.orderId}
          orderDocId={lastOrder?.id}
          onClearCart={clearCart}
        />
      </Suspense>
    );
  }

  if (currentPage === "orders")
    return (
      <Suspense fallback={<PageFallback />}>
        <MyOrdersPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "terms")
    return (
      <Suspense fallback={<PageFallback />}>
        <TermsPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "privacy")
    return (
      <Suspense fallback={<PageFallback />}>
        <PrivacyPage onNavigate={handleNavigation} />
      </Suspense>
    );
  if (currentPage === "cookies")
    return (
      <Suspense fallback={<PageFallback />}>
        <CookiesPage onNavigate={handleNavigation} />
      </Suspense>
    );

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

      {/* Shimmer keyframe — used by hero title gradient text */}
      <style>{`
        @keyframes hpShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .hp-shimmer-text {
          background: linear-gradient(
            90deg,
            #FF8534 0%,
            #FF9A52 38%,
            #FFB07A 50%,
            #FF9A52 62%,
            #FF8534 100%
          );
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: hpShimmer 9s ease-in-out 1 forwards;
          animation-delay: 0.6s;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative min-h-[100svh] md:h-[100vh] flex items-center justify-center overflow-hidden bg-[#FFF4E6]">
        <div className="absolute inset-0 z-0">
          {/* 1) Placeholder consistente */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1C2335] via-[#2E2E2E] to-black" />

          {/* 2) Imagen */}
          <div className="absolute inset-0">
            <ImageWithFallback
              src={HERO_SRC}
              alt="Hey!Point Estación inteligente automatizada"
              className="block w-full h-full object-cover object-center"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setHeroLoaded(true)}
              onError={() => setHeroLoaded(true)} // ✅ si falla, no te deja “negro”
            />
          </div>

          {/* 3) Base overlay — even darkening, slightly reduced to let vignette do the heavy lifting */}
          <div className="absolute inset-0 bg-black/35" />
          {/* 4) Radial vignette — edges darker, center bright (cinematic depth) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 60% 50%, transparent 20%, rgba(0,0,0,0.52) 100%)",
            }}
          />
          {/* 5) Bottom gradient — anchors the CTA, grounds the image */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/38 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl py-20">
          <div className="space-y-8">
            <h1 className="text-white text-5xl md:text-7xl mb-6 font-[Inter] font-bold text-[48px]">
              {/* Animated orange gradient — runs 2× on load then settles */}
              <span className="hp-shimmer-text block">
                Comprá online.
              </span>
              {/* Solid white for hierarchy — anchors the tagline */}
              <span className="block text-white">
                Retirá sin intermediarios.
              </span>
            </h1>

            <p className="text-white/95 max-w-2xl mx-auto text-lg md:text-xl">
              Elegí tus productos, pagá online y retirá tu compra.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center max-w-3xl mx-auto mt-10">
              <div className="w-full order-2 sm:order-none">
                <Button
                  onClick={() => handleNavigation("shop")}
                  className="w-full h-14 px-8 bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Store className="w-5 h-5" />
                  Entrar a la tienda
                </Button>
              </div>

              <div className="w-full order-1 sm:col-span-2 sm:order-first">
                <SmartSearchBar
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    setCurrentPage("productDetails");
                    // (MVP) sin URL en details
                  }}
                  onViewAllResults={(q) => {
                    setSearchQuery(q);
                    setSelectedCategory(null);
                    setCurrentPage("shop");
                    if (window.location.pathname !== "/tienda") {
                      window.history.pushState({}, "", "/tienda");
                    }
                  }}
                />
              </div>

              <div className="w-full order-3 sm:order-none">
                <Button
                  onClick={scrollToHowItWorks}
                  variant="outline"
                  aria-label="Ir a Cómo comprar"
                  className="w-full h-14 px-8 bg-white/10 hover:bg-[#FF6B00]/20 border-2 border-white/40 hover:border-[#FF6B00]/60 text-white hover:text-white rounded-full backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <div>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  ¿Cómo comprar?
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-6 h-10 border-2 border-white/70 rounded-full flex items-start justify-center p-2 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full mt-1" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white" id="como-funciona">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4 font-bold">
              ¿Cómo funciona?
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              Comprá, pagá y retiralo en minutos. Solo 3 pasos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {howItWorksSteps.map((step, index) => (
              <div key={index} className="h-full">
                <Card className="p-6 text-center border-none shadow-lg rounded-3xl bg-gradient-to-br from-[#FFF8F0] via-[#FFF4E6] to-white h-full flex flex-col items-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#FF6B00] to-[#FF8534] text-white rounded-2xl md:rounded-3xl mb-6 shadow-md">
                    {step.icon}
                  </div>
                  <div className="mb-2 text-[#FF6B00]">Paso {index + 1}</div>
                  <h3 className="text-[#1C2335] text-xl md:text-2xl mb-3 font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-[#2E2E2E] text-base">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-16 md:py-24 bg-[#FFF4E6]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4 font-bold">
              Categorías
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              Explorá nuestras categorias
            </p>
          </div>

          <div className="relative">
            {showCategoryEmptyState && (
              <Card className="max-w-3xl mx-auto border-none shadow-lg rounded-3xl bg-white p-8 text-center">
                <p className="text-[#1C2335] text-lg">
                  No hay categorías disponibles.
                </p>
                <p className="text-[#2E2E2E] mt-2">
                  Volvé a intentarlo en unos minutos.
                </p>
              </Card>
            )}
            {/* Mobile */}
            <div
              className={`md:hidden overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory ${
                showCategoryEmptyState ? "hidden" : ""
              }`}
            >
              <div className="flex gap-4 pl-4 pr-4 min-w-max">
                {showCategorySkeletons
                  ? categorySkeletonItems.map((_, index) => (
                      <Card
                        key={`category-skeleton-mobile-${index}`}
                        className="flex-shrink-0 w-[calc(50vw-24px)] min-w-[140px] max-w-[180px] border-none shadow-lg rounded-3xl overflow-hidden h-full"
                      >
                        <div className="h-36 bg-[#EAEAEA]/70 animate-pulse" />
                        <div className="p-4 bg-white">
                          <div className="h-5 w-24 mx-auto rounded bg-[#EAEAEA]/80 animate-pulse" />
                        </div>
                      </Card>
                    ))
                  : homeCategories.map((category, index) => (
                  <button
                    key={category.id || category.name}
                    onClick={() => handleCategorySelect(category.name)}
                    className="flex-shrink-0 w-[calc(50vw-24px)] min-w-[140px] max-w-[180px] snap-start group"
                  >
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden h-full">
                      <div className="relative h-36 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
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

                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 pointer-events-none" />
                    </Card>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop */}
            <div className={`hidden md:block ${showCategoryEmptyState ? "md:hidden" : ""}`}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {showCategorySkeletons
                  ? categorySkeletonItems.map((_, index) => (
                      <Card
                        key={`category-skeleton-desktop-${index}`}
                        className="border-none shadow-lg rounded-3xl overflow-hidden h-full"
                      >
                        <div className="h-44 bg-[#EAEAEA]/70 animate-pulse" />
                        <div className="p-5 bg-white">
                          <div className="h-6 w-28 mx-auto rounded bg-[#EAEAEA]/80 animate-pulse" />
                        </div>
                      </Card>
                    ))
                  : homeCategories.map((category, index) => (
                  <button
                    key={category.id || category.name}
                    onClick={() => handleCategorySelect(category.name)}
                    className="group"
                  >
                    <Card className="border-none shadow-lg rounded-3xl overflow-hidden h-full">
                      <div className="relative h-44 overflow-hidden">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
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

                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/0 to-[#FF8534]/0 pointer-events-none" />
                    </Card>
                  </button>
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
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-[#1C2335] text-3xl md:text-5xl mb-4 font-bold">
              ¿Por qué Hey!Point?
            </h2>
            <p className="text-[#2E2E2E] max-w-2xl mx-auto text-lg md:text-xl">
              Hey!Point es una plataforma que permite al cliente comprar
              productos online y retirarlos en un stand físico usando un token
              digital, sin intermediarios. Es una solución pensada para pequeñas
              comunidades y resuelve olvidos de último momento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="h-full">
                <Card className="p-6 border-none shadow-lg rounded-3xl bg-gradient-to-br from-white to-[#FFF8F0] h-full flex flex-col items-center text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#FF6B00]/10 to-[#FF8534]/10 text-[#FF6B00] rounded-2xl mb-4">
                    {benefit.icon}
                  </div>

                  <h3 className="text-[#1C2335] text-lg md:text-xl mb-2 font-semibold">
                    {benefit.title}
                  </h3>

                  <p className="text-[#2E2E2E] text-sm md:text-base">
                    {benefit.description}
                  </p>
                </Card>
              </div>
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
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            </div>

            <h2 className="text-white text-3xl md:text-5xl mb-6 font-bold">
              Encontrá el Hey!Point más cercano
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Descubrí la forma más inteligente de hacer tus compras. Rápido,
              seguro y siempre disponible.
            </p>

            <div>
              <Button
                onClick={() => handleNavigation("shop")}
                className="h-14 md:h-16 px-12 md:px-14 bg-white hover:bg-[#FFF4E6] text-[#FF6B00] rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center gap-3 mx-auto"
              >
                <Store className="w-5 h-5 md:w-6 md:h-6" />
                Explorar tienda
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={handleNavigation} />
    </div>
  );
}

/**
 * ✅ IMPORTANTE (servidor):
 * Necesitás rewrites SPA para que /tienda, /carrito, etc. sirvan index.html.
 * En Apache/Hostinger: agregá .htaccess (en la carpeta del index.html):
 *
 * <IfModule mod_rewrite.c>
 *   RewriteEngine On
 *   RewriteCond %{REQUEST_FILENAME} -f [OR]
 *   RewriteCond %{REQUEST_FILENAME} -d
 *   RewriteRule ^ - [L]
 *   RewriteRule ^ index.html [L]
 * </IfModule>
 */


