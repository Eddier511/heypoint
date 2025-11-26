import { motion } from "motion/react";
import { Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-[#FFF4E6] flex flex-col">
      <UnifiedHeader 
        onNavigate={onNavigate}
        currentPage="404"
        onCategorySelect={() => {}}
        isTransparent={false}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl text-center"
        >
          {/* 404 Number */}
          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#FF6B00] mb-6"
            style={{ fontSize: 'clamp(6rem, 20vw, 12rem)', fontWeight: 700, lineHeight: 1 }}
          >
            404
          </motion.h1>

          {/* Message */}
          <h2 className="text-[#1C2335] mb-4" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 600 }}>
            Página no encontrada
          </h2>
          
          <p className="text-[#2E2E2E] mb-8 max-w-md mx-auto" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
            La página que estás buscando no existe o fue movida.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate("home")}
              className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-8 py-6 rounded-full shadow-lg transition-all"
              style={{ fontSize: '1rem', fontWeight: 600 }}
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al inicio
            </Button>
            
            <Button
              onClick={() => onNavigate("shop")}
              variant="outline"
              className="border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6] px-8 py-6 rounded-full transition-all"
              style={{ fontSize: '1rem', fontWeight: 600 }}
            >
              <Search className="w-5 h-5 mr-2" />
              Ir a la tienda
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
