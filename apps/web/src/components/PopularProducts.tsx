import { Star, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PriceDisplay } from "./PriceDisplay";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { motion } from "motion/react";

interface PopularProductsProps {
  isLoggedIn?: boolean;
  onAddToCart?: () => void;
}

export function PopularProducts({ isLoggedIn = false, onAddToCart }: PopularProductsProps) {
  const popularProducts = [
    {
      name: "Organic Red Apples",
      image: "https://images.unsplash.com/photo-1623815242959-fb20354f9b8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBhcHBsZSUyMGZydWl0fGVufDF8fHx8MTc2MjIyNDQ2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 4.99,
      originalPrice: 5.99,
      rating: 4.8,
      discount: "Sale"
    },
    {
      name: "Fresh Bananas",
      image: "https://images.unsplash.com/photo-1757332050958-b797a022c910?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGJhbmFuYXN8ZW58MXx8fHwxNzYyMjUxMjMzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 2.49,
      rating: 4.6
    },
    {
      name: "Vine Tomatoes",
      image: "https://images.unsplash.com/photo-1623375477547-c73c4f274922?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXBlJTIwdG9tYXRvZXN8ZW58MXx8fHwxNzYyMzUwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 3.99,
      rating: 4.7
    },
    {
      name: "Artisan Sourdough Bread",
      image: "https://images.unsplash.com/photo-1534620808146-d33bb39128b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwYnJlYWR8ZW58MXx8fHwxNzYyMzUwMDIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 6.99,
      rating: 4.9
    },
    {
      name: "Organic Spinach",
      image: "https://images.unsplash.com/photo-1602193815349-525071f27564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwc3BpbmFjaHxlbnwxfHx8fDE3NjIzMjM3NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 2.99,
      rating: 4.5
    },
    {
      name: "Fresh Strawberries",
      image: "https://images.unsplash.com/photo-1710528184650-fc75ae862c13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHN0cmF3YmVycmllc3xlbnwxfHx8fDE3NjIyOTkyMzJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 3.49,
      originalPrice: 4.49,
      rating: 4.8,
      discount: "15% OFF"
    },
    {
      name: "Whole Milk",
      image: "https://images.unsplash.com/photo-1583507623011-5cc6ff99e11c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aG9sZSUyMG1pbGslMjBib3R0bGV8ZW58MXx8fHwxNzYyMzIzODUyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 3.49,
      rating: 4.6
    },
    {
      name: "Mixed Nuts",
      image: "https://images.unsplash.com/photo-1671981200629-014c03829abb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMG51dHMlMjBib3dsfGVufDF8fHx8MTc2MjM1MDAyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      price: 8.99,
      rating: 4.7
    }
  ];

  return (
    <section className="py-24 bg-[#FFF4E6]">
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '3rem', fontWeight: 700 }}>
            Popular Products
          </h2>
          <p className="text-[#2E2E2E] max-w-2xl mx-auto" style={{ fontSize: '1.25rem' }}>
            Top picks from our customers
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {popularProducts.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card className="group flex flex-col rounded-2xl overflow-hidden bg-white border-none shadow-md hover:shadow-xl transition-all p-4 h-full">
                <div className="relative h-48 rounded-xl overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.discount && (
                    <Badge className={`absolute top-3 left-3 ${product.discount === 'Sale' ? 'bg-[#4b1d78]' : 'bg-[#FF6B00]'} text-white border-none px-3 py-1`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {product.discount}
                    </Badge>
                  )}
                </div>
                
                {/* Product Info - Grows to fill space */}
                <div className="flex-1 flex flex-col pt-3">
                  {/* Product Name - Fixed height with ellipsis */}
                  <h3 
                    className="text-[#1C2335] mb-2 line-clamp-2 md:line-clamp-3" 
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: 600,
                      minHeight: '2.5rem', // Ensures space for 2 lines minimum
                      lineHeight: '1.25'
                    }}
                  >
                    {product.name}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-[#FF6B00] text-[#FF6B00]'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-[#2E2E2E] ml-1" style={{ fontSize: '0.875rem' }}>
                      ({product.rating})
                    </span>
                  </div>
                  
                  {/* Spacer to push price and button to bottom */}
                  <div className="flex-1"></div>
                  
                  {/* Price - Fixed baseline position */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <PriceDisplay price={product.price} originalPrice={product.originalPrice} />
                  </div>
                </div>
                
                {/* Add to Cart Button - Fixed at bottom */}
                <Button 
                  onClick={onAddToCart}
                  className="w-full bg-[#B6E322] hover:bg-[#a5d11f] text-[#1C2335] rounded-full flex-shrink-0" 
                  style={{ fontSize: '0.938rem', fontWeight: 600 }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white px-10 py-6 transition-all transform hover:scale-105"
            style={{ fontSize: '1.125rem', fontWeight: 600 }}
          >
            View All Products
          </Button>
        </motion.div>
      </div>
    </section>
  );
}