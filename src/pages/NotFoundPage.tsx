import { Home, SearchX, ShoppingBag } from "lucide-react";
import { Button } from "../components/ui/button";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="notFound" isTransparent={false} />

      <main className="flex flex-1 items-center justify-center px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <section className="w-full max-w-2xl rounded-2xl border border-[#FF6B00]/15 bg-white px-6 py-10 text-center shadow-lg sm:px-12 sm:py-14">
          <div aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4E6] text-[#FF6B00]">
            <SearchX size={28} strokeWidth={2} />
          </div>
          <p className="mb-4 text-7xl font-bold leading-none text-[#D95700] sm:text-8xl">
            404
          </p>
          <h1 className="mb-4 text-2xl font-bold text-[#1C2335] sm:text-3xl">
            ¡Ups! Esta página no está por acá
          </h1>
          <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-[#2E2E2E] sm:text-lg">
            La página que buscás no existe, cambió de lugar o ya no está disponible.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => onNavigate("home")}
              className="h-12 rounded-full bg-[#FF6B00] px-6 font-semibold text-white hover:bg-[#D95700] focus-visible:ring-2 focus-visible:ring-[#1C2335] focus-visible:ring-offset-2"
            >
              <Home size={20} aria-hidden="true" />
              Volver al inicio
            </Button>
            <Button
              onClick={() => onNavigate("shop")}
              variant="outline"
              className="h-12 rounded-full border-2 border-[#D95700] px-6 font-semibold text-[#B84700] hover:bg-[#FFF4E6] hover:text-[#933900] focus-visible:ring-2 focus-visible:ring-[#1C2335] focus-visible:ring-offset-2"
            >
              <ShoppingBag size={20} aria-hidden="true" />
              Ir a la tienda
            </Button>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
