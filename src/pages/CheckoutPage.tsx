import { useState } from "react";
import { ArrowLeft, Package, ShoppingBag, CreditCard, CheckCircle, Shield, HelpCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { BackToTopButton } from "../components/BackToTopButton";
import { Footer } from "../components/Footer";
import { ReservationTimer } from "../components/ReservationTimer";
import { InactivityExpirationModal } from "../components/InactivityExpirationModal";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { motion } from "motion/react";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

interface CheckoutPageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
}

export function CheckoutPage({ onNavigate, isLoggedIn = true }: CheckoutPageProps) {
  const { cartItems, clearCart } = useCart();
  const [currentStep] = useState(2); // Step 2 = Checkout/Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExpirationModal, setShowExpirationModal] = useState(false);

  // Inactivity timer - 15 minutos
  useInactivityTimer({
    onInactive: () => {
      setShowExpirationModal(true);
    },
    timeoutMinutes: 15,
    isEnabled: cartItems.length > 0 && !isProcessing // Solo si hay items y no está procesando
  });

  const handleExpirationConfirm = () => {
    // Vaciar carrito
    clearCart();
    // Cerrar modal
    setShowExpirationModal(false);
    // Volver a la tienda
    onNavigate?.("shop");
  };

  // Calcular totales - SIMPLIFICADO según requerimientos del cliente
  // El subtotal es el precio final con IVA ya incluido
  const subtotalProductos = cartItems.reduce((sum, item) => {
    const precioConIVA = getPrecioFinalConIVA(item.price);
    return sum + (precioConIVA * item.quantity);
  }, 0);
  
  // Cargo por servicio del 1% sobre el subtotal
  const cargoServicio = subtotalProductos * 0.01;
  
  // Total a pagar
  const totalAPagar = subtotalProductos + cargoServicio;

  const steps = [
    { number: 1, label: "Carrito", icon: ShoppingBag },
    { number: 2, label: "Pago", icon: CreditCard },
    { number: 3, label: "Confirmación de retiro", icon: Package }
  ];

  const handleMercadoPagoPayment = async () => {
    setIsProcessing(true);

    try {
      // Simulate redirecting to Mercado Pago
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success("Redirigiendo a Mercado Pago...", {
        description: "Serás redirigido al sitio seguro de pago",
        duration: 2000,
      });

      // Simulate payment completion and return
      setTimeout(() => {
        clearCart();
        onNavigate?.("success");
      }, 2000);

    } catch (error) {
      toast.error("Error al procesar el pago", {
        description: "Por favor intentá nuevamente",
        duration: 3000,
      });
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFF4E6]">
        <UnifiedHeader onNavigate={onNavigate} currentPage="checkout" isLoggedIn={isLoggedIn} isTransparent={false} />
        <div className="pt-20 lg:pt-24">
          <div className="container mx-auto px-4 sm:px-6 py-12 max-w-2xl text-center">
            <Card className="p-12 border-none shadow-lg rounded-3xl bg-white">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-[#1C2335] mb-2" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                Tu carrito está vacío
              </h3>
              <p className="text-[#2E2E2E] mb-6" style={{ fontSize: '1rem' }}>
                No hay productos para procesar el pago
              </p>
              <Button
                onClick={() => onNavigate?.("shop")}
                className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-8 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
                style={{ fontSize: '1rem', fontWeight: 600 }}
              >
                Ir a la tienda
              </Button>
            </Card>
          </div>
        </div>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="checkout" isLoggedIn={isLoggedIn} isTransparent={false} />

      {/* Back to Top Button */}
      <BackToTopButton />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          {/* Back Button */}
          <button
            onClick={() => onNavigate?.("cart")}
            className="flex items-center gap-2 text-[#2E2E2E] hover:text-[#FF6B00] transition-colors mb-6"
            style={{ fontSize: '0.938rem', fontWeight: 500 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al carrito
          </button>

          {/* Progress Indicator */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        currentStep >= step.number
                          ? "bg-[#FF6B00] text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span
                      className={`text-center text-xs sm:text-sm ${
                        currentStep >= step.number ? "text-[#FF6B00]" : "text-gray-400"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all ${
                        currentStep > step.number ? "bg-[#FF6B00]" : "bg-gray-200"
                      }`}
                      style={{ marginTop: '-30px' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 md:mb-12"
          >
            <h1 className="text-[#1C2335] mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}>
              Resumen de compra
            </h1>
            <p className="text-[#2E2E2E] mb-6" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
              Revisá tu pedido antes de pagar
            </p>

            {/* Reservation Timer - Web only */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-md mx-auto"
            >
              <ReservationTimer initialMinutes={15} />
            </motion.div>
          </motion.div>

          {/* Main Content - Centered Single Column */}
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="p-6 md:p-8 border-none shadow-xl rounded-3xl bg-white">
                {/* Products List */}
                <h2 className="text-[#1C2335] mb-6" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Productos ({cartItems.length})
                </h2>

                <div className="space-y-4 mb-8">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-4 p-4 bg-[#FFF4E6] rounded-2xl">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#1C2335] line-clamp-2 mb-2" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-[#2E2E2E] text-sm">
                            {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} × {formatPrecioARS(getPrecioFinalConIVA(item.price))}
                          </span>
                          <span className="text-[#FF6B00]" style={{ fontSize: '1rem', fontWeight: 700 }}>
                            {formatPrecioARS(getPrecioFinalConIVA(item.price) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-8" />

                {/* Price Summary - SIMPLIFICADO */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-[#1C2335] mb-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Detalle del pago
                  </h3>

                  {/* Subtotal de productos (ya con IVA) */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#2E2E2E]" style={{ fontSize: '0.938rem' }}>
                      Subtotal de productos
                    </span>
                    <span className="text-[#1C2335]" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                      {formatPrecioARS(subtotalProductos)}
                    </span>
                  </div>

                  {/* Cargo por servicio */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[#2E2E2E]" style={{ fontSize: '0.938rem' }}>
                        Cargo por servicio (1%)
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-[#FF6B00] hover:text-white transition-colors">
                            <HelpCircle className="w-3 h-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 bg-white border-2 border-[#FF6B00] rounded-2xl shadow-xl" sideOffset={8}>
                          <div className="space-y-2">
                            <h4 className="text-[#1C2335] mb-2" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                              ¿Qué incluye este cargo?
                            </h4>
                            <p className="text-[#2E2E2E] text-xs leading-relaxed">
                              Este cargo cubre el uso de la plataforma digital HeyPoint!, incluyendo el sistema de pagos seguros, tecnología de casilleros inteligentes, y mantenimiento de la infraestructura que hace posible tu compra 24/7.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <span className="text-[#1C2335]" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                      {formatPrecioARS(cargoServicio)}
                    </span>
                  </div>

                  <Separator className="my-4" />

                  {/* Total a pagar */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[#1C2335]" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      Total a pagar
                    </span>
                    <span className="text-[#FF6B00]" style={{ fontSize: '2rem', fontWeight: 700 }}>
                      {formatPrecioARS(totalAPagar)}
                    </span>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Mercado Pago Payment Section */}
                <div className="space-y-6">
                  <h3 className="text-[#1C2335] text-center mb-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Método de pago
                  </h3>

                  {/* Security Badge */}
                  <div className="flex items-center gap-3 p-4 bg-[#E8F5E9] rounded-2xl mb-6">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-[#2E2E2E] text-sm">
                      <span style={{ fontWeight: 600 }}>Pago 100% seguro</span> - Procesado por Mercado Pago
                    </p>
                  </div>

                  {/* Mercado Pago Button - Main CTA */}
                  <Button
                    onClick={handleMercadoPagoPayment}
                    disabled={isProcessing}
                    className="w-full py-7 rounded-full shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600,
                      backgroundColor: '#009EE3',
                      color: 'white'
                    }}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirigiendo a Mercado Pago...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15.5 2.5h-7c-2.2 0-4 1.8-4 4v11c0 2.2 1.8 4 4 4h7c2.2 0 4-1.8 4-4v-11c0-2.2-1.8-4-4-4zm-3.5 14c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
                        </svg>
                        Pagar con Mercado Pago
                      </span>
                    )}
                  </Button>

                  {/* Info Note */}
                  <div className="mt-6 p-4 bg-[#FFF4E6] rounded-2xl">
                    <div className="flex gap-3">
                      <Package className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <div className="text-[#2E2E2E] text-sm">
                        <p className="mb-2">
                          Serás redirigido a <span style={{ fontWeight: 600 }}>Mercado Pago</span> para completar el pago de forma segura.
                        </p>
                        <p>
                          Una vez confirmado, vas a recibir tu <span style={{ fontWeight: 600 }}>código alfanumérico</span> y <span style={{ fontWeight: 600 }}>ID de pedido</span> para retirar en tu HeyPoint.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods Accepted */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                    <p className="text-[#2E2E2E] text-sm mb-3 text-center" style={{ fontWeight: 600 }}>
                      Métodos de pago disponibles en Mercado Pago:
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs" style={{ fontWeight: 600 }}>
                        Tarjetas
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs" style={{ fontWeight: 600 }}>
                        Débito
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs" style={{ fontWeight: 600 }}>
                        Efectivo
                      </div>
                      <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs" style={{ fontWeight: 600 }}>
                        Transferencia
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

      {/* Inactivity Expiration Modal */}
      <InactivityExpirationModal
        isOpen={showExpirationModal}
        onConfirm={handleExpirationConfirm}
      />
    </div>
  );
}