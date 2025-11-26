import { useState, useEffect, useRef } from "react";
import { X, Search, ArrowRight, Package, Folder, FileText, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SearchResult {
  id: string;
  type: "product" | "category" | "page";
  title: string;
  subtitle?: string;
  price?: string;
  image?: string;
  category?: string;
  path: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
  onCategorySelect?: (category: string) => void;
}

export function GlobalSearchModal({ 
  isOpen, 
  onClose, 
  onNavigate,
  onCategorySelect 
}: GlobalSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sample data for search
  const allProducts: SearchResult[] = [
    {
      id: "1",
      type: "product",
      title: "Coca Cola 500ml",
      subtitle: "Refrescante bebida gaseosa",
      price: "$2.50",
      category: "Bebidas",
      image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
      path: "shop"
    },
    {
      id: "2",
      type: "product",
      title: "Doritos Nacho Cheese",
      subtitle: "Crujientes nachos sabor queso",
      price: "$3.99",
      category: "Snacks",
      image: "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400",
      path: "shop"
    },
    {
      id: "3",
      type: "product",
      title: "Red Bull Energy Drink",
      subtitle: "Bebida energética 250ml",
      price: "$4.50",
      category: "Bebidas",
      image: "https://images.unsplash.com/photo-1622543925917-763c34f5a89e?w=400",
      path: "shop"
    },
    {
      id: "4",
      type: "product",
      title: "Pringles Original",
      subtitle: "Papas en tubo sabor original",
      price: "$4.25",
      category: "Snacks",
      image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400",
      path: "shop"
    },
    {
      id: "5",
      type: "product",
      title: "Kit Kat Chocolate",
      subtitle: "Barra de chocolate crujiente",
      price: "$2.00",
      category: "Snacks",
      image: "https://images.unsplash.com/photo-1606312619070-d48b4a0a4f05?w=400",
      path: "shop"
    },
    {
      id: "6",
      type: "product",
      title: "Sprite Lemon-Lime",
      subtitle: "Refresco sabor lima-limón",
      price: "$2.50",
      category: "Bebidas",
      image: "https://images.unsplash.com/photo-1625740016791-26fa0318d9dd?w=400",
      path: "shop"
    }
  ];

  const allCategories: SearchResult[] = [
    {
      id: "cat-1",
      type: "category",
      title: "Snacks",
      subtitle: "120+ productos disponibles",
      path: "shop"
    },
    {
      id: "cat-2",
      type: "category",
      title: "Bebidas",
      subtitle: "90+ productos disponibles",
      path: "shop"
    },
    {
      id: "cat-3",
      type: "category",
      title: "Electrónica",
      subtitle: "45+ productos disponibles",
      path: "shop"
    },
    {
      id: "cat-4",
      type: "category",
      title: "Cuidado Personal",
      subtitle: "110+ productos disponibles",
      path: "shop"
    },
    {
      id: "cat-5",
      type: "category",
      title: "Congelados",
      subtitle: "75+ productos disponibles",
      path: "shop"
    },
    {
      id: "cat-6",
      type: "category",
      title: "Panadería",
      subtitle: "65+ productos disponibles",
      path: "shop"
    }
  ];

  const allPages: SearchResult[] = [
    {
      id: "page-1",
      type: "page",
      title: "Inicio",
      subtitle: "Página principal de HeyPoint",
      path: "home"
    },
    {
      id: "page-2",
      type: "page",
      title: "Tienda",
      subtitle: "Explorá todos los productos",
      path: "shop"
    },
    {
      id: "page-3",
      type: "page",
      title: "Contacto",
      subtitle: "Contactate con nosotros",
      path: "contact"
    },
    {
      id: "page-4",
      type: "page",
      title: "Sobre Nosotros",
      subtitle: "Conocé más sobre HeyPoint",
      path: "about"
    },
    {
      id: "page-5",
      type: "page",
      title: "Nuestra Empresa",
      subtitle: "Nuestra historia y misión",
      path: "ourcompany"
    },
    {
      id: "page-6",
      type: "page",
      title: "Mi Perfil",
      subtitle: "Gestioná tu cuenta",
      path: "profile"
    },
    {
      id: "page-7",
      type: "page",
      title: "Mis Pedidos",
      subtitle: "Ver historial de pedidos",
      path: "orders"
    },
    {
      id: "page-8",
      type: "page",
      title: "Carrito",
      subtitle: "Carrito de compras",
      path: "cart"
    }
  ];

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search products
    const matchingProducts = allProducts.filter(product => 
      product.title.toLowerCase().includes(query) ||
      product.subtitle?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    );
    results.push(...matchingProducts);

    // Search categories
    const matchingCategories = allCategories.filter(category =>
      category.title.toLowerCase().includes(query)
    );
    results.push(...matchingCategories);

    // Search pages
    const matchingPages = allPages.filter(page =>
      page.title.toLowerCase().includes(query) ||
      page.subtitle?.toLowerCase().includes(query)
    );
    results.push(...matchingPages);

    setSearchResults(results);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "category" && onCategorySelect) {
      onCategorySelect(result.title);
    }
    
    if (onNavigate) {
      onNavigate(result.path);
    }
    
    onClose();
  };

  const handleViewAllResults = () => {
    if (onNavigate) {
      onNavigate("shop");
    }
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "product":
        return <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />;
      case "category":
        return <Folder className="w-5 h-5 text-[#FF6B00]" />;
      case "page":
        return <FileText className="w-5 h-5 text-[#FF6B00]" />;
      default:
        return <Package className="w-5 h-5 text-[#FF6B00]" />;
    }
  };

  const getResultTypeBadge = (type: string) => {
    const badges = {
      product: { label: "Producto", color: "bg-[#FF6B00]/10 text-[#FF6B00]" },
      category: { label: "Categoría", color: "bg-purple-100 text-purple-700" },
      page: { label: "Página", color: "bg-blue-100 text-blue-700" }
    };
    
    const badge = badges[type as keyof typeof badges] || badges.product;
    
    return (
      <span 
        className={`px-2 py-0.5 rounded-full ${badge.color}`}
        style={{ fontSize: '0.688rem', fontWeight: 600 }}
      >
        {badge.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Search Modal */}
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-20 md:pt-24 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-3xl bg-white pointer-events-auto rounded-3xl shadow-2xl overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-modal-title"
              aria-describedby="search-modal-description"
            >
              {/* Hidden title for screen readers */}
              <h2 id="search-modal-title" className="sr-only">
                Global Search
              </h2>
              <p id="search-modal-description" className="sr-only">
                Search for products, categories, and pages across HeyPoint
              </p>

              {/* Search Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-[#FF6B00] pointer-events-none z-10" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar productos, categorías, páginas..."
                        className="pl-12 md:pl-14 pr-4 py-5 md:py-6 rounded-2xl border-2 border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 focus:ring-4 transition-all"
                        style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}
                      />
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2E2E2E] flex items-center justify-center transition-all hover:scale-105"
                      aria-label="Cerrar búsqueda"
                    >
                      <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>

                  {/* Search Stats */}
                  {searchQuery && (
                    <p className="text-[#2E2E2E]/60" style={{ fontSize: '0.875rem' }}>
                      {searchResults.length > 0 
                        ? `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''} encontrado${searchResults.length !== 1 ? 's' : ''}`
                        : 'No se encontraron resultados'
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {searchQuery === "" ? (
                  // Initial State - Popular Searches
                  <div className="p-6">
                    <h3 className="text-[#1C2335] mb-4" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                      Búsquedas populares
                    </h3>
                    <div className="grid gap-3">
                      {["Coca Cola", "Snacks", "Bebidas", "Doritos", "Perfil"].map((term, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(term)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF4E6] transition-all text-left"
                        >
                          <Search className="w-5 h-5 text-[#2E2E2E]/40" />
                          <span className="text-[#2E2E2E]" style={{ fontSize: '1rem' }}>
                            {term}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  // Results Found
                  <div className="p-6 space-y-3">
                    {searchResults.map((result) => (
                      <motion.button
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleResultClick(result)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-[#FFF4E6] transition-all text-left group"
                      >
                        {/* Icon or Image */}
                        <div className="flex-shrink-0">
                          {result.image ? (
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-gray-100">
                              <ImageWithFallback
                                src={result.image}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#FFF4E6] flex items-center justify-center">
                              {getResultIcon(result.type)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[#1C2335] truncate" style={{ fontSize: '1rem', fontWeight: 600 }}>
                              {result.title}
                            </h4>
                            {getResultTypeBadge(result.type)}
                          </div>
                          {result.subtitle && (
                            <p className="text-[#2E2E2E]/60 truncate" style={{ fontSize: '0.875rem' }}>
                              {result.subtitle}
                            </p>
                          )}
                          {result.category && (
                            <p className="text-[#FF6B00] mt-1" style={{ fontSize: '0.813rem', fontWeight: 500 }}>
                              {result.category}
                            </p>
                          )}
                        </div>

                        {/* Price or Arrow */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          {result.price && (
                            <span className="text-[#1C2335] hidden sm:block" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                              {result.price}
                            </span>
                          )}
                          <ArrowRight className="w-5 h-5 text-[#2E2E2E]/30 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  // No Results
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-[#FFF4E6] flex items-center justify-center">
                      <Search className="w-10 h-10 md:w-12 md:h-12 text-[#FF6B00]/40" />
                    </div>
                    <h3 className="text-[#1C2335] mb-2" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 600 }}>
                      No encontramos resultados
                    </h3>
                    <p className="text-[#2E2E2E]/60 mb-6" style={{ fontSize: 'clamp(0.938rem, 2.5vw, 1rem)' }}>
                      Intenta buscar con palabras diferentes o revisa la ortografía
                    </p>
                    <Button
                      onClick={handleViewAllResults}
                      variant="outline"
                      className="mx-auto border-2 border-[#FF6B00]/30 text-[#FF6B00] hover:bg-[#FFF4E6] rounded-full px-6 py-5"
                      style={{ fontSize: '1rem', fontWeight: 600 }}
                    >
                      Ver todos los productos
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer - View All Results */}
              {searchQuery && searchResults.length > 0 && (
                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-100 p-5 md:p-6">
                  <Button
                    onClick={handleViewAllResults}
                    className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8534] hover:from-[#e56000] hover:to-[#FF6B00] text-white rounded-2xl h-14 md:h-16 shadow-lg hover:shadow-xl transition-all"
                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 700 }}
                  >
                    Ver todos los resultados
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}