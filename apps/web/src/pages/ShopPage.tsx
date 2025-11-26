import { useState, useEffect } from "react";
import { Filter, X, ChevronDown, Grid3x3, LayoutList } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { QuantitySelector } from "../components/QuantitySelector";
import { AddToCartButton } from "../components/AddToCartButton";
import { ProductCardSkeleton } from "../components/ProductCardSkeleton";
import { SaleChip } from "../components/SaleChip";
import { StockIndicator } from "../components/StockIndicator";
import { PriceDisplay } from "../components/PriceDisplay";
import { motion, AnimatePresence } from "motion/react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: string;
  badges?: string[];
  stock: number; // Add stock property
}

interface ShopPageProps {
  onProductClick: (product: Product) => void;
  onNavigate?: (page: string) => void;
  selectedCategory?: string | null;
  onCategorySelect?: (category: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function ShopPage({ onProductClick, onNavigate, selectedCategory = null, onCategorySelect, searchQuery, onClearSearch }: ShopPageProps) {
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(selectedCategory ? [selectedCategory] : []);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileGridCompact, setIsMobileGridCompact] = useState(true);
  const [productQuantities, setProductQuantities] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isOfertasFilterActive, setIsOfertasFilterActive] = useState(false);
  const itemsPerPage = 12;

  // Debug log for searchQuery
  useEffect(() => {
    console.log('[ShopPage] searchQuery prop received:', searchQuery);
  }, [searchQuery]);

  // Initialize quantity for a product (default to 1)
  const getQuantity = (productId: number) => {
    return productQuantities[productId] || 1;
  };

  // Update quantity for a product
  const updateQuantity = (productId: number, quantity: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  // Update selected categories when selectedCategory prop changes
  useEffect(() => {
    if (selectedCategory) {
      setSelectedCategories([selectedCategory]);
    }
  }, [selectedCategory]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, priceRange, searchQuery]);

  const allProducts: Product[] = [
    {
      id: 1,
      name: "Artisan Sourdough Bread",
      image: "https://images.unsplash.com/photo-1534620808146-d33bb39128b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwYnJlYWR8ZW58MXx8fHwxNzYyMzUwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 8900.00,
      rating: 4.9,
      category: "Bakery",
      stock: 25 // High stock - will show green badge in detail
    },
    {
      id: 2,
      name: "Fresh Broccoli",
      image: "https://images.unsplash.com/photo-1602193815349-525071f27564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwc3BpbmFjaHxlbnwxfHx8fDE3NjIzMjM3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 5500.00,
      rating: 4.3,
      category: "Vegetables",
      stock: 15 // High stock - will show green badge in detail
    },
    {
      id: 3,
      name: "Fresh Bananas",
      image: "https://images.unsplash.com/photo-1757332050958-b797a022c910?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGJhbmFuYXN8ZW58MXx8fHwxNzYyMjUxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 4200.00,
      rating: 4.6,
      category: "Fruits",
      stock: 7 // Low stock - will show yellow badge in detail
    },
    {
      id: 4,
      name: "Fresh Strawberries",
      image: "https://images.unsplash.com/photo-1710528184650-fc75ae862c13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHN0cmF3YmVycmllc3xlbnwxfHx8fDE3NjIyOTkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 12500.00,
      rating: 4.8,
      category: "Fruits",
      stock: 2 // Very low stock - will show yellow badge in detail, warning in card
    },
    {
      id: 5,
      name: "Granola Bars",
      image: "https://images.unsplash.com/photo-1648663939143-124a4f0aaf9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFub2xhJTIwY2VyZWFsJTIwYm93bHxlbnwxfHx8fDE3NjIzNTA4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 9800.00,
      originalPrice: 12000.00,
      rating: 4.5,
      category: "Snacks",
      badges: ["Sale"],
      stock: 8
    },
    {
      id: 6,
      name: "Greek Yogurt",
      image: "https://images.unsplash.com/photo-1641494587136-eec74f1944ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMHlvZ3VydCUyMGJvd2x8ZW58MXx8fHwxNzYyMjY3NTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 7500.00,
      rating: 4.8,
      category: "Dairy",
      stock: 14
    },
    {
      id: 7,
      name: "Mixed Nuts",
      image: "https://images.unsplash.com/photo-1671981200629-014c03829abb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMG51dHMlMjBib3dsfGVufDF8fHx8MTc2MjM1MDAyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 15600.00,
      rating: 4.7,
      category: "Snacks",
      stock: 5
    },
    {
      id: 8,
      name: "Green Smoothie",
      image: "https://images.unsplash.com/photo-1604404894204-03fc8bf2c028?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHNtb290aGllJTIwYm90dGxlfGVufDF8fHx8MTc2MjM1MDg3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 6900.00,
      rating: 4.6,
      category: "Beverages",
      stock: 18
    },
    {
      id: 9,
      name: "Organic Red Apples",
      image: "https://images.unsplash.com/photo-1623815242959-fb20354f9b8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBhcHBsZSUyMGZydWl0fGVufDF8fHx8MTc2MjIyNDQ2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 8200.00,
      originalPrice: 9500.00,
      rating: 4.8,
      category: "Fruits",
      badges: ["Sale"],
      stock: 10
    },
    {
      id: 10,
      name: "Fresh Oranges",
      image: "https://images.unsplash.com/photo-1613370487983-4bd43a899822?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMG9yYW5nZXMlMjBmcnVpdHxlbnwxfHx8fDE3NjIzNTA4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 6700.00,
      rating: 4.7,
      category: "Fruits",
      stock: 1
    },
    {
      id: 11,
      name: "Fresh Carrots",
      image: "https://images.unsplash.com/photo-1603462903957-566630607cc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNhcnJvdHMlMjB2ZWdldGFibGVzfGVufDF8fHx8MTc2MjMzMjM1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 5200.00,
      rating: 4.5,
      category: "Vegetables",
      stock: 25
    },
    {
      id: 12,
      name: "Organic Eggs",
      image: "https://images.unsplash.com/photo-1623428454609-8ed6a4628b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwZWdncyUyMGJhc2tldHxlbnwxfHx8fDE3NjIyNTk0Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 7800.00,
      rating: 4.9,
      category: "Dairy",
      stock: 12
    },
    {
      id: 13,
      name: "Whole Grain Pasta",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGZvb2R8ZW58MXx8fHwxNzYyMzUwODc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 5900.00,
      rating: 4.6,
      category: "Bakery",
      stock: 15
    },
    {
      id: 14,
      name: "Cherry Tomatoes",
      image: "https://images.unsplash.com/photo-1623375477547-c73c4f274922?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXBlJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzYyMzUwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 7200.00,
      rating: 4.7,
      category: "Vegetables",
      stock: 20
    },
    {
      id: 15,
      name: "Fresh Blueberries",
      image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGJsdWViZXJyaWVzfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 14500.00,
      rating: 4.9,
      category: "Fruits",
      stock: 10
    },
    {
      id: 16,
      name: "Almond Milk",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbG1vbmQlMjBtaWxrfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 4490.00,
      rating: 4.5,
      category: "Dairy",
      stock: 18
    },
    {
      id: 17,
      name: "Organic Honey",
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784378?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwaG9uZXl8ZW58MXx8fHwxNzYyMzUwODc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 9990.00,
      rating: 4.8,
      category: "Snacks",
      stock: 5
    },
    {
      id: 18,
      name: "Orange Juice",
      image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmFuZ2UlMjBqdWljZXxlbnwxfHx8fDE3NjIzNTA4Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 5490.00,
      rating: 4.6,
      category: "Beverages",
      stock: 12
    },
    {
      id: 19,
      name: "Croissants",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9pc3NhbnR8ZW58MXx8fHwxNzYyMzUwODc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 5990.00,
      rating: 4.9,
      category: "Bakery",
      stock: 10
    },
    {
      id: 20,
      name: "Fresh Spinach",
      image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNwaW5hY2h8ZW58MXx8fHwxNzYyMzUwODc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 3290.00,
      rating: 4.4,
      category: "Vegetables",
      stock: 15
    },
    {
      id: 21,
      name: "Avocados",
      image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdm9jYWRvfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 6490.00,
      originalPrice: 7490.00,
      rating: 4.8,
      category: "Fruits",
      badges: ["Sale"],
      stock: 8
    },
    {
      id: 22,
      name: "Cheddar Cheese",
      image: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVkZGFyJTIwY2hlZXNlfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 7990.00,
      rating: 4.7,
      category: "Dairy",
      stock: 12
    },
    {
      id: 23,
      name: "Dark Chocolate",
      image: "https://images.unsplash.com/photo-1511381939415-e44015466834?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY2hvY29sYXRlfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 4990.00,
      rating: 4.9,
      category: "Snacks",
      stock: 3
    },
    {
      id: 24,
      name: "Iced Coffee",
      image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpY2VkJTIwY29mZmVlfGVufDF8fHx8MTc2MjM1MDg3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 3990.00,
      rating: 4.5,
      category: "Beverages",
      stock: 0
    }
  ];

  const categories = [
    { name: "Fruits", count: 4 },
    { name: "Vegetables", count: 3 },
    { name: "Dairy", count: 2 },
    { name: "Snacks", count: 2 },
    { name: "Beverages", count: 1 },
    { name: "Bakery", count: 1 }
  ];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 20000]);
    setIsOfertasFilterActive(false);
  };

  const filteredProducts = allProducts.filter(product => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
    const searchMatch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const ofertaMatch = !isOfertasFilterActive || (product.originalPrice && product.originalPrice > product.price);
    return categoryMatch && priceMatch && searchMatch && ofertaMatch;
  });

  const activeFiltersCount = selectedCategories.length + (priceRange[0] !== 0 || priceRange[1] !== 20000 ? 1 : 0) + (isOfertasFilterActive ? 1 : 0);

  // Handle page change with loading state
  const handlePageChange = (newPage: number) => {
    setIsLoadingPage(true);
    
    // Scroll to top of products grid smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Simulate loading delay for skeleton (600ms for smooth UX)
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsLoadingPage(false);
    }, 600);
  };

  // Filter Panel Component (reusable for both desktop and mobile)
  const FilterPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-6">
      {/* Clear Filters Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#1C2335] text-lg md:text-xl">
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
              {activeFiltersCount}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-[#FF6B00] hover:bg-[#FFF4E6] rounded-full text-sm"
        >
          Limpiar todo
        </Button>
      </div>

      {/* Category Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-[#1C2335] text-base">
            Categoría
          </h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCategories.includes(category.name)}
                    onCheckedChange={() => toggleCategory(category.name)}
                  />
                  <label 
                    className="text-[#2E2E2E] cursor-pointer text-sm" 
                    onClick={() => toggleCategory(category.name)}
                  >
                    {category.name}
                  </label>
                </div>
                <span className="text-[#2E2E2E] text-sm">
                  ({category.count})
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-[#1C2335] text-base">
            Rango de precio
          </h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={20000}
            step={500}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-[#2E2E2E] text-sm">
            <span>{formatPrecioARS(priceRange[0])}</span>
            <span>{formatPrecioARS(priceRange[1])}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Ofertas Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full group">
          <h4 className="text-[#1C2335] text-base">
            Ofertas
          </h4>
          <ChevronDown className="w-5 h-5 text-[#2E2E2E] transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isOfertasFilterActive}
              onCheckedChange={(checked: boolean) => setIsOfertasFilterActive(checked as boolean)}
            />
            <label 
              className="text-[#2E2E2E] cursor-pointer text-sm" 
              onClick={() => setIsOfertasFilterActive(!isOfertasFilterActive)}
            >
              Mostrar solo ofertas
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader 
        onNavigate={onNavigate} 
        currentPage="shop" 
        onCategorySelect={onCategorySelect}
        isTransparent={false}
      />
      
      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Page Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-[#1C2335] mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>
              Tienda
            </h1>
            <p className="text-[#2E2E2E]" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
              Productos frescos y de calidad directo a tu puerta
            </p>
          </div>

          {/* Ofertas Destacadas Section */}
          {(() => {
            const productosEnOferta = allProducts.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 6);
            
            if (productosEnOferta.length === 0) return null;
            
            return (
              <div className="mb-8 sm:mb-12">
                <Card className="bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF4E6] border-2 border-[#FF6B00]/20 shadow-lg rounded-3xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8534] p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl">🔥</span>
                        </div>
                        <div>
                          <h2 className="text-white" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 700 }}>
                            Ofertas destacadas para vos
                          </h2>
                          <p className="text-white/90" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                            Aprovechá estos precios exclusivos
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsOfertasFilterActive(true)}
                        variant="ghost"
                        className="hidden sm:flex bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full px-4 py-2"
                        style={{ fontSize: '0.938rem', fontWeight: 600 }}
                      >
                        Ver todas
                      </Button>
                    </div>
                  </div>

                  {/* Products Carousel */}
                  <div className="p-4 sm:p-6">
                    {/* Mobile: Horizontal Scroll */}
                    <div className="lg:hidden overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                      <div className="flex gap-4 min-w-max">
                        {productosEnOferta.map((product) => {
                          const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                          
                          return (
                            <motion.div
                              key={product.id}
                              whileHover={{ y: -4 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="w-[280px] sm:w-[320px] flex-shrink-0"
                            >
                              <Card
                                className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                                onClick={() => onProductClick(product)}
                              >
                                <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                                  <ImageWithFallback
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute top-3 right-3">
                                    <SaleChip variant="orange" size="lg" />
                                  </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col pt-3">
                                  <h3 
                                    className="text-[#1C2335] mb-3 line-clamp-2" 
                                    style={{ 
                                      fontSize: '1rem', 
                                      fontWeight: 600,
                                      minHeight: '2.5rem',
                                      lineHeight: '1.25'
                                    }}
                                  >
                                    {product.name}
                                  </h3>
                                  
                                  <div className="flex-1"></div>
                                  
                                  <div className="mb-2">
                                    <PriceDisplay 
                                      price={product.price} 
                                      originalPrice={product.originalPrice}
                                      size="md"
                                      showSaleChip={false}
                                    />
                                    {hasDiscount && (
                                      <span className="text-[#2E2E2E] block mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        ¡Ahorrás {formatPrecioARS(getPrecioFinalConIVA(product.originalPrice!) - getPrecioFinalConIVA(product.price))}!
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mb-3 min-h-[14px]">
                                    <StockIndicator stock={product.stock} variant="card" />
                                  </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-center sm:justify-start">
                                    <QuantitySelector
                                      quantity={getQuantity(product.id)}
                                      onQuantityChange={(newQuantity) => updateQuantity(product.id, newQuantity)}
                                      max={product.stock}
                                    />
                                  </div>
                                  <AddToCartButton 
                                    productId={product.id}
                                    productName={product.name}
                                    productImage={product.image}
                                    productPrice={product.price}
                                    quantity={getQuantity(product.id)}
                                    variant="compact"
                                    disabled={product.stock === 0}
                                    stock={product.stock}
                                  />
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Desktop: Grid */}
                    <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                      {productosEnOferta.map((product) => {
                        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                        
                        return (
                          <motion.div
                            key={product.id}
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                          >
                            <Card
                              className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                              onClick={() => onProductClick(product)}
                            >
                              <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                                <ImageWithFallback
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3">
                                  <SaleChip variant="orange" size="lg" />
                                </div>
                              </div>
                              
                              <div className="flex-1 flex flex-col pt-3">
                                <h3 
                                  className="text-[#1C2335] mb-3 line-clamp-2 text-base"
                                >
                                  {product.name}
                                </h3>
                                
                                <div className="flex-1"></div>
                                
                                <div className="mb-2">
                                  <PriceDisplay 
                                    price={product.price} 
                                    originalPrice={product.originalPrice}
                                    size="lg"
                                    showSaleChip={false}
                                  />
                                  {hasDiscount && (
                                    <span className="text-[#2E2E2E] block mt-1 text-xs">
                                      ¡Ahorrás {formatPrecioARS(getPrecioFinalConIVA(product.originalPrice!) - getPrecioFinalConIVA(product.price))}!
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mb-3 min-h-[14px]">
                                  <StockIndicator stock={product.stock} variant="card" />
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <QuantitySelector
                                  quantity={getQuantity(product.id)}
                                  onQuantityChange={(newQuantity) => updateQuantity(product.id, newQuantity)}
                                  max={product.stock}
                                />
                                <AddToCartButton 
                                  productId={product.id}
                                  productName={product.name}
                                  productImage={product.image}
                                  productPrice={product.price}
                                  quantity={getQuantity(product.id)}
                                  variant="compact"
                                  disabled={product.stock === 0}
                                  stock={product.stock}
                                />
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Mobile "Ver todas" link - Subtle text link instead of prominent button */}
                    <div className="sm:hidden mt-4 flex justify-center">
                      <button
                        onClick={() => setIsOfertasFilterActive(true)}
                        className="text-[#FF6B00] hover:text-[#e56000] transition-colors flex items-center gap-1"
                        style={{ fontSize: '0.938rem', fontWeight: 600 }}
                      >
                        Ver todas las ofertas
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Mobile Filter Button */}
          <div className="xl:hidden mb-6 flex gap-3">
            <Button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex-1 sm:flex-initial sm:w-auto bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-md"
              style={{ fontSize: '1rem', fontWeight: 600 }}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-[#FF6B00] text-white border-none">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            
            {/* Mobile Grid Toggle Button - Only visible on mobile */}
            <Button
              onClick={() => setIsMobileGridCompact(!isMobileGridCompact)}
              className="sm:hidden bg-white text-[#1C2335] border-2 border-[#FF6B00] hover:bg-[#FFF4E6] rounded-full shadow-md px-4"
              aria-label={isMobileGridCompact ? "Cambiar a vista expandida" : "Cambiar a vista compacta"}
            >
              {isMobileGridCompact ? (
                <Grid3x3 className="w-5 h-5" />
              ) : (
                <LayoutList className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters Sidebar - Hidden on mobile/tablet */}
            <aside className="hidden xl:block w-72 flex-shrink-0">
              <Card className="p-6 bg-white border-none shadow-md rounded-2xl sticky top-24">
                <FilterPanel />
              </Card>
            </aside>

            {/* Products Grid */}
            <main className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-[#2E2E2E]" style={{ fontSize: '0.938rem' }}>
                  Mostrando {filteredProducts.length} de {allProducts.length} productos
                </p>
                <Select defaultValue="name">
                  <SelectTrigger className="w-full sm:w-48 border-gray-200 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="price-low">Precio: Menor a mayor</SelectItem>
                    <SelectItem value="price-high">Precio: Mayor a menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid - Responsive columns with mobile toggle */}
              <div className={`grid ${isMobileGridCompact ? 'grid-cols-2' : 'grid-cols-1'} sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6`}>
                {isLoadingPage ? (
                  // Show skeleton loaders while loading
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <ProductCardSkeleton key={`skeleton-${index}`} />
                  ))
                ) : (
                  // Show actual products
                  filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(product => {
                    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                    
                    return (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <Card
                        className="group cursor-pointer flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-shadow p-4 h-full"
                        onClick={() => onProductClick(product)}
                      >
                        <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Nuevo sistema de badges con SaleChip */}
                          {product.badges && product.badges.length > 0 && (
                            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                              {product.badges.map((badge, index) => (
                                badge === "Sale" ? (
                                  <SaleChip key={index} variant="orange" size="md" />
                                ) : (
                                  <Badge
                                    key={index}
                                    className="bg-[#B6E322] text-white border-2 border-white px-3 py-1 shadow-md"
                                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                                  >
                                    {badge}
                                  </Badge>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Product Info - Grows to fill space */}
                        <div className="flex-1 flex flex-col pt-3">
                          {/* Product Name - Fixed height with ellipsis */}
                          <h3 
                            className="text-[#1C2335] mb-3 line-clamp-2 md:line-clamp-3" 
                            style={{ 
                              fontSize: '1rem', 
                              fontWeight: 600,
                              minHeight: '2.5rem',
                              lineHeight: '1.25'
                            }}
                          >
                            {product.name}
                          </h3>
                          
                          {/* Spacer to push price and button to bottom */}
                          <div className="flex-1"></div>
                          
                          {/* Price Section - Unificado */}
                          <div className="mb-2">
                            <PriceDisplay 
                              price={product.price} 
                              originalPrice={product.originalPrice}
                              size="md"
                              showSaleChip={false}
                            />
                            {hasDiscount && (
                              <span className="text-[#2E2E2E] block mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                ¡Ahorrás {formatPrecioARS(getPrecioFinalConIVA(product.originalPrice!) - getPrecioFinalConIVA(product.price))}!
                              </span>
                            )}
                          </div>
                          
                          {/* Stock Indicator - Positioned below price */}
                          <div className="mb-3 min-h-[14px]">
                            <StockIndicator stock={product.stock} variant="card" />
                          </div>
                        </div>
                        
                        {/* Quantity Selector and Add to Cart - Fixed at bottom */}
                        <div className="flex flex-col gap-3 items-stretch flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <QuantitySelector
                            quantity={getQuantity(product.id)}
                            onQuantityChange={(newQuantity) => updateQuantity(product.id, newQuantity)}
                            max={product.stock}
                          />
                          <AddToCartButton 
                            productId={product.id}
                            productName={product.name}
                            productImage={product.image}
                            productPrice={product.price}
                            quantity={getQuantity(product.id)}
                            variant="compact"
                            disabled={product.stock === 0}
                            stock={product.stock}
                          />
                        </div>
                      </Card>
                    </motion.div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {Math.ceil(filteredProducts.length / itemsPerPage) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-12">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-all"
                    style={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
                    <span className="text-[#2E2E2E]" style={{ fontSize: '1rem' }}>
                      Página
                    </span>
                    <Badge className="bg-[#FF6B00] text-white border-none px-3 py-1" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {currentPage}
                    </Badge>
                    <span className="text-[#2E2E2E]" style={{ fontSize: '1rem' }}>
                      de {Math.ceil(filteredProducts.length / itemsPerPage)}
                    </span>
                  </div>

                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                    className="w-full sm:w-auto h-12 px-6 bg-white text-[#FF6B00] border-2 border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#FF6B00] rounded-full shadow-md transition-all"
                    style={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 xl:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            {/* Slide-in Filter Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 xl:hidden max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] p-6 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <Filter className="w-6 h-6 text-white" />
                  <h2 className="text-white" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    Filtros
                  </h2>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="p-6">
                <FilterPanel onClose={() => setIsMobileFiltersOpen(false)} />
              </div>

              {/* Apply Button */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <Button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full py-6 shadow-lg"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                >
                  Aplicar filtros ({filteredProducts.length} productos)
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}