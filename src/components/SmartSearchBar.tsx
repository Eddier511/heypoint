import React, { useEffect, useRef, useState } from "react";
import { Search, X, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { ProductsAPI, CategoriesAPI } from "../lib/api";

type ApiProduct = Record<string, any>;
type ApiCategory = { id?: string; name?: string } | Record<string, any>;

export interface Product {
  id: string;
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

function toNumber(v: any) {
  const n =
    typeof v === "string"
      ? Number(v.replace(/\./g, "").replace(",", "."))
      : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isActiveLoose(v: any) {
  if (v === undefined || v === null) return true;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v).trim().toLowerCase();
  return ["active", "activo", "enabled", "true", "1"].includes(s);
}

function pickFirst(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function normalizeProduct(
  p: ApiProduct,
  categoryMap: Record<string, string>,
): Product | null {
  // id (acepta id, _id, uid, productId, etc)
  const rawId = pickFirst(p, ["id", "_id", "uid", "productId", "productoId"]);
  const id = rawId ? String(rawId).trim() : "";

  // name (acepta name, title, nombre, etc)
  const rawName = pickFirst(p, [
    "name",
    "title",
    "nombre",
    "nombreProducto",
    "productName",
  ]);
  const name = rawName ? String(rawName).trim() : "";

  if (!id || !name) return null;

  // image
  const rawImg = pickFirst(p, [
    "imageUrl",
    "image",
    "imagen",
    "img",
    "photo",
    "urlImagen",
  ]);
  const image = (rawImg ? String(rawImg).trim() : "") || DEFAULT_IMG;

  // price
  const rawPrice = pickFirst(p, ["price", "precio", "cost", "monto", "amount"]);
  const price = toNumber(rawPrice);

  // category
  const rawCategoryName = pickFirst(p, [
    "category",
    "categoria",
    "categoryName",
    "nombreCategoria",
  ]);
  const rawCategoryId = pickFirst(p, [
    "categoryId",
    "categoriaId",
    "category_id",
  ]);
  const category =
    (rawCategoryName ? String(rawCategoryName) : "") ||
    (rawCategoryId ? categoryMap[String(rawCategoryId)] : "") ||
    "Sin categoría";

  return { id, name, image, price, category };
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await CategoriesAPI.getAll();
        const raw = (res as any)?.data;
        const list: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        const map: Record<string, string> = {};
        list.forEach((c) => {
          const id = pickFirst(c, [
            "id",
            "_id",
            "uid",
            "categoryId",
            "categoriaId",
          ]);
          const name = pickFirst(c, ["name", "nombre", "title"]);
          if (id && name) map[String(id)] = String(name);
        });
        if (alive) categoryMapRef.current = map;
      } catch (e) {
        console.warn("[SmartSearchBar] Categories load failed", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load products
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setIsLoading(true);
        const res = await ProductsAPI.getAll();

        // 🔥 Esto suele variar: a veces viene res.data, a veces res.data.data
        const raw = (res as any)?.data;
        const list: ApiProduct[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.items)
              ? raw.items
              : [];

        console.log("[SmartSearchBar] products raw sample:", list?.[0]);
        console.log("[SmartSearchBar] products raw count:", list.length);

        const mapped = list
          // status flexible
          .filter((p) =>
            isActiveLoose(p?.status ?? p?.estado ?? p?.isActive ?? p?.activo),
          )
          .map((p) => normalizeProduct(p, categoryMapRef.current))
          .filter(Boolean) as Product[];

        console.log("[SmartSearchBar] products mapped count:", mapped.length);
        console.log("[SmartSearchBar] products mapped sample:", mapped?.[0]);

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

  // dropdown position
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

  // disable scroll in mobile fullscreen
  useEffect(() => {
    document.body.style.overflow = isMobileSearchMode ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSearchMode]);

  // search debounce
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const t = setTimeout(() => {
      const filtered = allProducts.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        return nameMatch || catMatch;
      });

      setResults(filtered.slice(0, 12));
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(t);
  }, [query, allProducts]);

  // click outside (desktop)
  useEffect(() => {
    if (isMobileSearchMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideInput = searchRef.current?.contains(target);
      const insideDrop = dropdownRef.current?.contains(target);
      if (!insideInput && !insideDrop) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileSearchMode]);

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
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const closeMobileSearch = () => {
    setIsMobileSearchMode(false);
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    setIsLoading(false);
    inputRef.current?.blur();
    onClose?.();
  };

  const handleInputFocus = () => {
    if (isMobile) {
      setIsMobileSearchMode(true);
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setIsOpen(true);
    }
  };

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

    if (!isOpen) return;

    // -1 nada, 0..len-1 item, len ver todos
    const allowViewAll = results.length > 0;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!allowViewAll) return;
        setSelectedIndex((prev) => Math.min(prev + 1, results.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!allowViewAll) return;
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (!query.trim()) return;
        if (results.length === 0) return; // no hay nada que seleccionar
        if (selectedIndex === -1 || selectedIndex === results.length)
          return handleViewAllResults();
        return handleProductSelect(results[selectedIndex]);
    }
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

  // MOBILE FULLSCREEN
  if (isMobileSearchMode && typeof window !== "undefined") {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10000] bg-[#FFF4E6] flex flex-col"
      >
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

              <AnimatePresence>
                {query.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    type="button"
                    onClick={handleClear}
                    aria-label="Limpiar búsqueda"
                    className="
        absolute right-3 top-1/2 -translate-y-1/2
        h-10 w-10 rounded-full
        grid place-items-center
        leading-none
        hover:bg-gray-100 transition-colors
      "
                  >
                    <X className="h-5 w-5 text-[#2E2E2E]/60 block" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

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
              <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
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

              <div className="flex-shrink-0 sticky bottom-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200/50">
                <Button
                  onClick={handleViewAllResults}
                  className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8534] hover:from-[#e56000] hover:to-[#FF6B00] text-white rounded-full h-14"
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

  // DESKTOP
  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div ref={inputContainerRef} className="relative z-[9999]">
        <div className="relative bg-white/95 backdrop-blur-sm rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50"
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
            aria-label="Buscar productos"
          />

          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-5 h-5 text-[#2E2E2E]/60" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {isOpen &&
          query.trim().length > 0 &&
          !isMobile &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
              <div className="overflow-hidden flex flex-col rounded-3xl border bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                {isLoading && (
                  <div className="p-8 flex items-center justify-center gap-3 text-[#2E2E2E]/60">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                    <span style={{ fontSize: "1rem", fontWeight: 500 }}>
                      Buscando...
                    </span>
                  </div>
                )}

                {!isLoading && results.length === 0 && (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FFF4E6]/80 flex items-center justify-center">
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
                  <div className="max-h-[520px] overflow-y-auto">
                    {results.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-[#FFF4E6]/60"
                      >
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p
                            className="text-[#1C2335] truncate"
                            style={{ fontSize: "1rem", fontWeight: 600 }}
                          >
                            {highlightMatch(product.name, query)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[#FF6B00]"
                              style={{ fontSize: "1rem", fontWeight: 700 }}
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
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
