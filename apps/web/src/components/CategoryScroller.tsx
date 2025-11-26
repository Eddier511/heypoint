import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Category {
  name: string;
  items: number;
  image: string;
}

interface CategoryScrollerProps {
  categories: Category[];
}

export function CategoryScroller({ categories }: CategoryScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply for faster scrolling
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-4 px-2"
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#FF6B00 #FFF4E6",
      }}
    >
      <div className="flex gap-6 inline-flex">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="inline-block"
          >
            <Card 
              className="w-[280px] border-none shadow-lg rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-all cursor-pointer group select-none"
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="relative h-40 overflow-hidden">
                <ImageWithFallback
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-[#1C2335] mb-1" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {category.name}
                </h3>
                <p className="text-[#2E2E2E]" style={{ fontSize: "0.875rem" }}>
                  {category.items}+ items
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
