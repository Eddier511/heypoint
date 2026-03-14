import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  CreditCard,
  Package,
  CheckCircle,
  HelpCircle,
  Key,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { QuantitySelector } from "../components/QuantitySelector";
import { StockIndicator } from "../components/StockIndicator";
import { BackToTopButton } from "../components/BackToTopButton";
import { Footer } from "../components/Footer";
import { InactivityExpirationModal } from "../components/InactivityExpirationModal";
import { useInactivityTimer } from "../hooks/useInactivityTimer";
import { formatPrecioARS, getPrecioFinalConIVA } from "../utils/priceUtils";
import { motion } from "motion/react";
import { useCart } from "../contexts/CartContext";
import { useStoreSettings } from "../hooks/useStoreSettings";

interface ShoppingCartPageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
}

export function ShoppingCartPage({
  onNavigate,
  isLoggedIn = true,
}: ShoppingCartPageProps) {
  const { cartItems, updateCartItem, removeFromCart, clearCart } = useCart();

  const { settings } = useStoreSettings();
  const ivaPct = settings?.iva ?? 21;

  const [currentStep] = useState(1);
  const [showExpirationModal, setShowExpirationModal] = useState(false);

  useInactivityTimer({
    onInactive: () => setShowExpirationModal(true),
    timeoutMinutes: 15,
    isEnabled: cartItems.length > 0,
  });

  const handleExpirationConfirm = () => {
    clearCart();
    setShowExpirationModal(false);
    onNavigate?.("shop");
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
  };

  const removeItem = async (productId: string) => {
    await removeFromCart(productId);
  };

  const subtotalProductos = cartItems.reduce((sum, item) => {
    const precioConIVA = getPrecioFinalConIVA(item.price, ivaPct);
    return sum + precioConIVA * item.quantity;
  }, 0);

  const reglaCargoAplicada = useMemo(() => {
    const rules = settings?.serviceChargeRules ?? [];

    return (
      rules.find(
        (rule) =>
          subtotalProductos >= Number(rule.min) &&
          subtotalProductos <= Number(rule.max),
      ) || null
    );
  }, [settings?.serviceChargeRules, subtotalProductos]);

  const cargoServicio = reglaCargoAplicada ? Number(reglaCargoAplicada.fee) : 0;
  const totalAPagar = subtotalProductos + cargoServicio;

  const textoCargoServicio = useMemo(() => {
    if (!reglaCargoAplicada) return "Cargo por servicio";

    const min = Number(reglaCargoAplicada.min);
    const max = Number(reglaCargoAplicada.max);

    if (min === 0) {
      return `Cargo por servicio (compras hasta ${formatPrecioARS(max)})`;
    }

    if (max >= 999000) {
      return `Cargo por servicio (compras mayores a ${formatPrecioARS(min - 1)})`;
    }

    return `Cargo por servicio (${formatPrecioARS(min)} - ${formatPrecioARS(max)})`;
  }, [reglaCargoAplicada]);

  const steps = [
    { number: 1, label: "Carrito", icon: ShoppingBag },
    { number: 2, label: "Pago", icon: CreditCard },
    { number: 3, label: "Confirmación de retiro", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="cart"
        isLoggedIn={isLoggedIn}
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          <button
            onClick={() => onNavigate?.("shop")}
            className="flex items-center gap-2 text-[#2E2E2E] hover:text-[#FF6B00] transition-colors mb-6"
            style={{ fontSize: "0.938rem", fontWeight: 500 }}
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a la tienda
          </button>

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
                        currentStep >= step.number
                          ? "text-[#FF6B00]"
                          : "text-gray-400"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 sm:mx-2 transition-all ${
                        currentStep > step.number
                          ? "bg-[#FF6B00]"
                          : "bg-gray-200"
                      }`}
                      style={{ marginTop: "-30px" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1
              className="text-[#1C2335] mb-2 text-3xl sm:text-4xl"
              style={{ fontWeight: 700 }}
            >
              Tu carrito
            </h1>
            {cartItems.length > 0 && (
              <p className="text-[#2E2E2E] text-base sm:text-lg">
                {cartItems.length}{" "}
                {cartItems.length === 1 ? "producto" : "productos"} listos para
                el pago
              </p>
            )}
          </motion.div>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3
                  className="text-[#1C2335] mb-2"
                  style={{ fontSize: "1.5rem", fontWeight: 600 }}
                >
                  Tu carrito está vacío
                </h3>
                <p className="text-[#2E2E2E] mb-6" style={{ fontSize: "1rem" }}>
                  ¡Empezá a agregar productos para comenzar!
                </p>
                <Button
                  onClick={() => onNavigate?.("shop")}
                  className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-8 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  Seguir comprando
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="space-y-4"
                >
                  {cartItems.map((item) => (
                    <Card
                      key={item.productId}
                      className="p-4 sm:p-6 border-none shadow-lg rounded-3xl bg-white hover:shadow-xl transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <ImageWithFallback
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h3
                              className="text-[#1C2335] mb-1 text-lg sm:text-xl"
                              style={{ fontWeight: 600 }}
                            >
                              {item.name}
                            </h3>

                            <div className="mb-2">
                              <StockIndicator
                                stock={item.stock}
                                variant="card"
                              />
                            </div>

                            <div className="flex items-start gap-2 mb-3">
                              <CheckCircle className="w-4 h-4 text-[#B6E322] flex-shrink-0 mt-0.5" />
                              <span
                                className="text-[#5C3A1E] text-xs sm:text-sm"
                                style={{ fontWeight: 500 }}
                              >
                                Disponible para retiro en tu HeyPoint más
                                cercano
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                              <QuantitySelector
                                quantity={item.quantity}
                                onQuantityChange={(newQuantity) =>
                                  updateQuantity(item.productId, newQuantity)
                                }
                                max={item.stock}
                              />

                              <div className="text-right">
                                <div className="text-[#2E2E2E] text-xs sm:text-sm">
                                  {formatPrecioARS(
                                    getPrecioFinalConIVA(item.price, ivaPct),
                                  )}{" "}
                                  cada uno
                                </div>
                                <div
                                  className="text-[#FF6B00] text-lg sm:text-xl"
                                  style={{ fontWeight: 700 }}
                                >
                                  {formatPrecioARS(
                                    getPrecioFinalConIVA(item.price, ivaPct) *
                                      item.quantity,
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId)}
                              className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors self-end sm:self-auto"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </motion.div>
              </div>

              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="p-6 sm:p-8 border-none shadow-xl rounded-3xl bg-white lg:sticky lg:top-24">
                    <h2
                      className="text-[#1C2335] mb-6 text-2xl sm:text-3xl"
                      style={{ fontWeight: 700 }}
                    >
                      Resumen del pedido
                    </h2>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[#2E2E2E] text-sm">
                          Subtotal de productos
                        </span>
                        <span
                          className="text-[#1C2335] text-sm"
                          style={{ fontWeight: 600 }}
                        >
                          {formatPrecioARS(subtotalProductos)}
                        </span>
                      </div>
                      <p className="text-xs text-[#666666]">
                        Precios con IVA incluido ({ivaPct}%).
                      </p>

                      <Separator className="my-4" />

                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2E2E2E] text-sm">
                            {textoCargoServicio}
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-[#FF6B00] hover:text-white transition-colors">
                                <HelpCircle className="w-3 h-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 p-4 bg-white border-2 border-[#FF6B00] rounded-2xl shadow-xl"
                              sideOffset={8}
                            >
                              <div className="space-y-2">
                                <h4
                                  className="text-[#1C2335] mb-2"
                                  style={{
                                    fontSize: "0.938rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  ¿Qué incluye este cargo?
                                </h4>
                                <p className="text-[#2E2E2E] text-xs leading-relaxed">
                                  Este cargo cubre el uso de la plataforma
                                  digital HeyPoint!, incluyendo el sistema de
                                  pagos seguros, tecnología de casilleros
                                  inteligentes y mantenimiento de la
                                  infraestructura.
                                </p>

                                {reglaCargoAplicada && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs text-[#666666]">
                                      Regla aplicada:
                                    </p>
                                    <p className="text-xs font-medium text-[#1C2335]">
                                      Desde{" "}
                                      {formatPrecioARS(reglaCargoAplicada.min)}{" "}
                                      hasta{" "}
                                      {formatPrecioARS(reglaCargoAplicada.max)}
                                    </p>
                                    <p className="text-xs font-medium text-[#FF6B00]">
                                      Cargo fijo:{" "}
                                      {formatPrecioARS(reglaCargoAplicada.fee)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <span
                          className="text-[#1C2335] text-sm"
                          style={{ fontWeight: 600 }}
                        >
                          {formatPrecioARS(cargoServicio)}
                        </span>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex justify-between items-center gap-4 pt-2">
                        <span
                          className="text-[#1C2335] text-lg sm:text-xl"
                          style={{ fontWeight: 700 }}
                        >
                          Total final
                        </span>
                        <span
                          className="text-[#FF6B00] text-2xl sm:text-3xl"
                          style={{ fontWeight: 700 }}
                        >
                          {formatPrecioARS(totalAPagar)}
                        </span>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <>
                        <Button
                          onClick={() => onNavigate?.("checkout")}
                          className="w-full mb-3 py-6 rounded-full shadow-lg transition-all transform hover:scale-105 text-white"
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            backgroundColor: "#FF6B00",
                          }}
                        >
                          Continuar con el pago
                        </Button>

                        <Button
                          onClick={() => onNavigate?.("shop")}
                          variant="outline"
                          className="w-full py-5 sm:py-6 rounded-full border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] transition-all text-sm sm:text-base"
                          style={{ fontWeight: 600 }}
                        >
                          Seguir comprando
                        </Button>

                        <div className="mt-6 p-4 bg-[#FFF4E6] rounded-2xl">
                          <div className="flex gap-3">
                            <Key className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-bold text-base sm:text-lg text-[#2E2E2E] mb-1">
                                Tu código para retirar
                              </p>

                              <p className="text-xs sm:text-sm text-[#2E2E2E] leading-relaxed">
                                Después de completar el pago vas a recibir un{" "}
                                <span className="font-semibold text-[#FF6B00]">
                                  código de retiro en tu correo electrónico
                                </span>
                                .
                                <br />
                                Ese{" "}
                                <span className="font-semibold">
                                  código (token)
                                </span>{" "}
                                te permitirá{" "}
                                <span className="font-semibold">
                                  desbloquear tu pedido en el stand de HeyPoint
                                </span>{" "}
                                y retirar tus productos.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BackToTopButton />
      <Footer onNavigate={onNavigate} />

      <InactivityExpirationModal
        isOpen={showExpirationModal}
        onConfirm={handleExpirationConfirm}
      />
    </div>
  );
}
