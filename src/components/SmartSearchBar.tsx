import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { ProductsAPI, CategoriesAPI } from "../lib/api";

type ApiProduct = {
  id?: string;
  name?: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  price?: number | string;
  categoryId?: string;
  category?: string; // a veces viene nombre directo
  status?: "active" | "inactive" | boolean;
};

type ApiCategory = {
  id?: string;
  name?: string;
};

export interface Product {
  id: string; // ✅ Firestore friendly
  name: string;
  image: string;
  price: number;
  category: string;
}

interface SmartSearchBarProps {
  onProductClick?: (product: Product) => void;
  onViewAllResults?: (query: string) => void;
  className?: string;
  placeholder?: string;
  onClose?: () => void;
}

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=1200&q=80";

function isActive(v: any) {
  if (v === undefined || v === null) return true;
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "active";
}

function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function SmartSearchBar({
  onProductClick,
  onViewAllResults,
  className = "",
  placeholder = "Buscar productos…",
  onClose,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isMobileSearchMode, setIsMobileSearchMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categoryMapRef = useRef<Record<string, string>>({});

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load categories (optional: to show category name)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await CategoriesAPI.getAll(); // GET /api/categories
        const list: ApiCategory[] = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, string> = {};
        list.forEach((c) => {
          if (c?.id && c?.name) map[String(c.id)] = String(c.name);
        });
        if (alive) categoryMapRef.current = map;
      } catch {
        // ok si falla
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load products real from API (once)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setIsLoading(true);
        const res = await ProductsAPI.getAll(); // GET /api/products
        const raw: ApiProduct[] = Array.isArray(res.data) ? res.data : [];

        const mapped: Product[] = raw
          .filter((p) => isActive(p.status))
          .map((p) => {
            const id = String(p.id ?? "").trim();
            const name = String(p.name ?? p.title ?? "").trim();
            if (!id || !name) return null;

            const image = String(p.imageUrl ?? p.image ?? "").trim() || DEFAULT_IMG;
            const price = toNumber(p.price);

            const category =
              (p.category ? String(p.category) : "") ||
              (p.categoryId ? categoryMapRef.current[String(p.categoryId)] : "") ||
              "Sin categoría";

            return { id, name, image, price, category };
          })
          .filter(Boolean) as Product[];

        if (!alive) return;
        setAllProducts(mapped);
      } catch (e) {
        console.warn("[SmartSearchBar] Failed to load products", e);
        if (alive) setAllProducts([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && inputContainerRef.current && !isMobileSearchMode) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 16,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, isMobileSearchMode]);

  // Disable body scroll when mobile search mode is active
  useEffect(() => {
    document.body.style.overflow = isMobileSearchMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSearchMode]);

  // Close dropdown on scroll (desktop only)
  useEffect(() => {
    if (!isOpen || isMobileSearchMode) return;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - lastScrollY);
      if (diff > 150) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen, isMobileSearchMode]);

  // Update position on resize (desktop only)
  useEffect(() => {
    if (!isOpen || isMobileSearchMode) return;

    const updatePosition = () => {
      if (!inputContainerRef.current) return;
      const rect = inputContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 16,
        left: rect.left,
        width: rect.width,
      });
    };

    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen, isMobileSearchMode]);

  // ✅ Real search (debounced)
  useEffect(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(() => {
      const filtered = allProducts.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        return nameMatch || catMatch;
      });

      setResults(filtered.slice(0, 12)); // limit para UI
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, allProducts]);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (isMobileSearchMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        searchRef.current &&
        !searchRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSearchMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && query.trim().length > 0) setIsOpen(true);

    if (e.key === "Escape") {
      if (isMobileSearchMode) closeMobileSearch();
      else {
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
      }
      return;
    }

    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex === -1 || selectedIndex === results.length) {
          handleViewAllResults();
        } else if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleProductSelect(results[selectedIndex]);
        }
        break;
    }
  };

  const handleProductSelect = (product: Product) => {
    setIsOpen(false);
    setIsMobileSearchMode(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    onProductClick?.(product);
  };

  const handleViewAllResults = () => {
    const q = query.trim();
    if (!q) return;
    setIsOpen(false);
    setIsMobileSearchMode(false);
    setSelectedIndex(-1);
    onViewAllResults?.(q);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (isMobile) {
      setIsMobileSearchMode(true);
      setIsOpen(true);
    } else {
      if (query.trim().length > 0) setIsOpen(true);
    }
  };

  const closeMobileSearch = () => {
    setIsMobileSearchMode(false);
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
    onClose?.();
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span
          key={index}
          className="bg-[#FFF4E6] text-[#FF6B00]"
          style={{ fontWeight: 600 }}
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  // Mobile fullscreen mode
  if (isMobileSearchMode && typeof window !== "undefined") {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10000] bg-[#FFF4E6] flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-shrink-0 bg-white shadow-md"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
            paddingBottom: "12px",
            paddingLeft: "16px",
            paddingRight: "16px",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={closeMobileSearch}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Cerrar búsqueda"
            >
              <ArrowLeft className="w-6 h-6 text-[#1C2335]" />
            </button>

            <div className="flex-1 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6B00]"
                style={{ width: "20px", height: "20px" }}
                aria-hidden="true"
              />

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                className="w-full pl-14 pr-14 py-4 outline-none text-[#2E2E2E] bg-transparent placeholder:text-[#2E2E2E]/40"
                style={{ fontSize: "1rem", fontWeight: 400 }}
                aria-label="Buscar productos"
              />

              {/* ✅ Clear bien alineado */}
              <AnimatePresence>
                {query.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                               w-10 h-10 rounded-full
                               hover:bg-gray-100 transition-colors
                               flex items-center justify-center"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-5 h-5 text-[#2E2E2E]/60" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Results */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="flex-1 overflow-hidden flex flex-col"
        >
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-[#2E2E2E]/60">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                <span style={{ fontSize: "1.063rem", fontWeight: 500 }}>
                  Buscando...
                </span>
              </div>
            </div>
          )}

          {!isLoading && query.trim().length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <Search className="w-10 h-10 text-[#FF6B00]/60" />
                </div>
                <p
                  className="text-[#1C2335]"
                  style={{ fontSize: "1.125rem", fontWeight: 600 }}
                >
                  ¿Qué estás buscando?
                </p>
                <p
                  className="text-[#2E2E2E]/60 mt-2"
                  style={{ fontSize: "1rem" }}
                >
                  Escribí para buscar productos
                </p>
              </div>
            </div>
          )}

          {!isLoading && query.trim().length > 0 && results.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <Search className="w-10 h-10 text-[#FF6B00]/60" />
                </div>
                <p
                  className="text-[#1C2335]"
                  style={{ fontSize: "1.125rem", fontWeight: 600 }}
                >
                  No encontramos resultados
                </p>
                <p
                  className="text-[#2E2E2E]/60 mt-2"
                  style={{ fontSize: "1rem" }}
                >
                  Intenta con otro término de búsqueda
                </p>
              </div>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div
                className="flex-1 overflow-y-auto overscroll-contain bg-white"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#FF6B00 rgba(255, 244, 230, 0.5)",
                }}
              >
                <div className="px-4 py-2">
                  <p
                    className="text-[#2E2E2E]/60 mb-3"
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {results.length}{" "}
                    {results.length === 1 ? "resultado" : "resultados"}
                  </p>
                </div>

                {results.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`
                      w-full flex items-center gap-4 p-4 transition-all duration-150
                      ${index === selectedIndex ? "bg-[#FFF4E6]" : "hover:bg-[#FFF4E6]/50 active:bg-[#FFF4E6]"}
                      ${index < results.length - 1 ? "border-b border-gray-200/60" : ""}
                    `}
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p
                        className="text-[#1C2335] mb-1"
                        style={{ fontSize: "1rem", fontWeight: 600 }}
                      >
                        {highlightMatch(product.name, query)}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[#FF6B00]"
                          style={{ fontSize: "1.063rem", fontWeight: 700 }}
                        >
                          {formatPrecioARS(getPrecioFinalConIVA(product.price))}
                        </span>
                        <span className="text-[#2E2E2E]/40">•</span>
                        <span
                          className="text-[#2E2E2E]/60"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                <div className="h-24" />
              </div>

              <div
                className="flex-shrink-0 sticky bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-[0_-4px_16px_rgba(0,0,0,0.1)]"
                style={{
                  paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
                }}
              >
                <Button
                  onClick={handleViewAllResults}
                  className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8534] hover:from-[#e56000] hover:to-[#FF6B00] text-white rounded-full h-14 shadow-[0_4px_16px_rgba(255,107,0,0.25)] hover:shadow-[0_6px_24px_rgba(255,107,0,0.35)] transition-all duration-200"
                  style={{ fontSize: "1.063rem", fontWeight: 700 }}
                >
                  Ver todos los resultados ({results.length})
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>,
      document.body,
    );
  }

  // Desktop mode
  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && !isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div ref={inputContainerRef} className="relative z-[9999]">
        <motion.div
          animate={{
            scale: isOpen && query.trim().length > 0 ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={`
            relative bg-white/95 backdrop-blur-sm rounded-full transition-all duration-200
            ${
              isOpen && query.trim().length > 0
                ? "shadow-[0_12px_40px_rgba(255,107,0,0.25)] ring-2 ring-[#FF6B00]/30"
                : "shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.15)]"
            }
          `}
        >
          <Search
            className={`
              absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-200
              ${isOpen && query.trim().length > 0 ? "text-[#FF6B00]" : "text-[#2E2E2E]/50"}
            `}
            style={{ width: "20px", height: "20px" }}
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-14 pl-14 pr-16 outline-none text-[#2E2E2E] rounded-full bg-transparent placeholder:text-[#2E2E2E]/40"
            style={{ fontSize: "clamp(1rem, 2vw, 1rem)", fontWeight: 400 }}
            aria-label="Buscar productos"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
            }
          />

          {/* ✅ X PERFECTA (centrada y con hit-area) */}
          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           w-10 h-10 rounded-full
                           hover:bg-gray-100 transition-colors
                           flex items-center justify-center"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-5 h-5 text-[#2E2E2E]/60" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {isOpen &&
          query.trim().length > 0 &&
          !isMobile &&
          typeof window !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {isOpen && query.trim().length > 0 && (
                <motion.div
                  ref={dropdownRef}
                  id="search-results"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  className="fixed z-[9999]"
                  role="listbox"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    maxHeight: "calc(100vh - 180px)",
                  }}
                >
                  <div
                    className="overflow-hidden flex flex-col"
                    style={{
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      borderRadius: "24px",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow:
                        "0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 107, 0, 0.15)",
                      maxHeight: "calc(100vh - 180px)",
                    }}
                  >
                    {isLoading && (
                      <div className="p-8">
                        <div className="flex items-center justify-center gap-3 text-[#2E2E2E]/60">
                          <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                          <span style={{ fontSize: "1rem", fontWeight: 500 }}>
                            Buscando...
                          </span>
                        </div>
                      </div>
                    )}

                    {!isLoading && results.length === 0 && (
                      <div className="p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF4E6]/80 backdrop-blur-sm flex items-center justify-center">
                          <Search className="w-8 h-8 text-[#FF6B00]/60" />
                        </div>
                        <p
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "1.063rem", fontWeight: 600 }}
                        >
                          No encontramos resultados
                        </p>
                        <p
                          className="text-[#2E2E2E]/60 mt-2"
                          style={{ fontSize: "0.938rem" }}
                        >
                          Intenta con otro término de búsqueda
                        </p>
                      </div>
                    )}

                    {!isLoading && results.length > 0 && (
                      <>
                        <div
                          className="overflow-y-auto overscroll-contain"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor:
                              "#FF6B00 rgba(255, 244, 230, 0.5)",
                            maxHeight: `${7 * 72}px`,
                            minHeight: "80px",
                          }}
                        >
                          {results.map((product, index) => (
                            <button
                              key={product.id}
                              id={`search-result-${index}`}
                              onClick={() => handleProductSelect(product)}
                              className={`
                                w-full flex items-center gap-4 p-3.5 transition-all duration-150
                                min-h-[72px]
                                ${
                                  index === selectedIndex
                                    ? "bg-[#FFF4E6]/70 backdrop-blur-sm"
                                    : "hover:bg-white/60"
                                }
                                ${
                                  index < results.length - 1
                                    ? "border-b border-gray-200/40"
                                    : ""
                                }
                              `}
                              role="option"
                              aria-selected={index === selectedIndex}
                            >
                              <div className="flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-white/80 shadow-sm">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="flex-1 text-left min-w-0">
                                <p
                                  className="text-[#1C2335] truncate mb-1"
                                  style={{ fontSize: "1rem", fontWeight: 600 }}
                                >
                                  {highlightMatch(product.name, query)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-[#FF6B00]"
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {formatPrecioARS(
                                      getPrecioFinalConIVA(product.price),
                                    )}
                                  </span>
                                  <span className="text-[#2E2E2E]/40">•</span>
                                  <span
                                    className="text-[#2E2E2E]/60 truncate"
                                    style={{ fontSize: "0.813rem" }}
                                  >
                                    {product.category}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="flex-shrink-0 sticky bottom-0 p-4 bg-white/60 backdrop-blur-md border-t border-gray-200/50">
                          <Button
                            onClick={handleViewAllResults}
                            className={`
                              w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8534] 
                              hover:from-[#e56000] hover:to-[#FF6B00] 
                              text-white rounded-2xl h-12
                              shadow-[0_4px_16px_rgba(255,107,0,0.25)]
                              hover:shadow-[0_6px_24px_rgba(255,107,0,0.35)]
                              transition-all duration-200
                              ${
                                selectedIndex === results.length
                                  ? "ring-2 ring-[#FF6B00] ring-offset-2"
                                  : ""
                              }
                            `}
                            style={{ fontSize: "1rem", fontWeight: 700 }}
                          >
                            Ver todos los resultados ({results.length})
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </div>
    </div>
  );
}
