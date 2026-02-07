import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { TokenInput } from "../components/TokenInput";
import { BackToTopButton } from "../components/BackToTopButton";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle,
  Mail,
  MapPin,
  Package,
  Home,
  ShoppingBag,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useEffect, useRef, useState } from "react";

interface PurchaseSuccessPageProps {
  onNavigate?: (page: string) => void;
  userEmail?: string;
  userName?: string;
  pickupCode?: string;
  isLoggedIn?: boolean;
  onClearCart?: () => void;
}

export function PurchaseSuccessPage({
  onNavigate,
  userEmail = "john.doe@example.com",
  userName = "John",
  pickupCode = "A3X9K2",
  isLoggedIn = true,
  onClearCart,
}: PurchaseSuccessPageProps) {
  // Use ref to track if cart has been cleared to prevent infinite loop
  const hasCleared = useRef(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // CRITICAL: Scroll to top immediately when page loads
  // This ensures users see the success animation, especially when returning from payment
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Clear cart when this page mounts (only once)
  useEffect(() => {
    if (onClearCart && !hasCleared.current) {
      console.log(
        "[PurchaseSuccessPage] Clearing cart after successful purchase",
      );
      onClearCart();
      hasCleared.current = true;
    }
  }, []); // Empty dependency array - only run on mount

  // Hide confetti after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const howToCollectSteps = [
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Revisá tu correo",
      description: `Te enviamos un email de confirmación a ${userEmail} con tu código de retiro alfanumérico de 6 caracteres.`,
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Andá a tu HeyPoint! más cercano",
      description:
        "Encontrá el punto HeyPoint! en la entrada de tu edificio o en la ubicación designada.",
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Ingresá tu código",
      description:
        "Ingresá tu código alfanumérico de 6 caracteres para desbloquear tu locker y retirar tu pedido.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="success"
        isLoggedIn={isLoggedIn}
        isTransparent={false}
      />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
          {/* Success Message with Confetti Animation */}
          <div className="relative">
            {/* Confetti Elements */}
            <AnimatePresence>
              {showConfetti && (
                <>
                  {/* Confetti particles */}
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        y: -20,
                        x: Math.random() * window.innerWidth,
                        opacity: 1,
                        scale: Math.random() * 0.5 + 0.5,
                      }}
                      animate={{
                        y: window.innerHeight + 100,
                        rotate: Math.random() * 360,
                        opacity: 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut",
                        delay: Math.random() * 0.5,
                      }}
                      className="absolute w-3 h-3 rounded-full pointer-events-none z-50"
                      style={{
                        backgroundColor: [
                          "#FF6B00",
                          "#FFB800",
                          "#B6E322",
                          "#FF8534",
                        ][Math.floor(Math.random() * 4)],
                        left: `${(i / 30) * 100}%`,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 relative z-10"
            >
              {/* Check Circle Icon - NARANJA con Pulse */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-[#FF6B00] to-[#FF8534] rounded-full mb-6 shadow-2xl relative"
              >
                {/* Pulse Rings */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#FF6B00]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#FF6B00]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />

                {/* Check Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle
                    className="w-16 h-16 text-white relative z-10"
                    strokeWidth={2.5}
                  />
                </motion.div>

                {/* Sparkles around check */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-8 h-8 text-[#FFB800]" fill="#FFB800" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-2"
                  animate={{
                    rotate: [360, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5,
                  }}
                >
                  <Sparkles className="w-6 h-6 text-[#B6E322]" fill="#B6E322" />
                </motion.div>
              </motion.div>

              {/* Title with bounce animation */}
              <motion.h1
                className="text-[#1C2335] mb-4"
                style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 700 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              >
                ¡Pedido Confirmado!
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-[#2E2E2E] max-w-2xl mx-auto mb-6"
                style={{
                  fontSize: "clamp(1rem, 3vw, 1.25rem)",
                  lineHeight: "1.5",
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                ¡Gracias,{" "}
                <span className="text-[#FF6B00]" style={{ fontWeight: 700 }}>
                  {userName}
                </span>
                ! 🎉
                <br />
                Tu compra fue procesada exitosamente.
              </motion.p>

              {/* Email Badge - DESTACADO */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                className="inline-block"
              >
                <Card className="border-2 border-[#FF6B00]/30 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-white to-[#FFF4E6]">
                  <div className="px-6 py-4 flex items-center gap-3">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -10, 10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex-shrink-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                    </motion.div>
                    <div className="text-left">
                      <p
                        className="text-[#2E2E2E]/70 text-xs mb-0.5"
                        style={{ fontWeight: 500 }}
                      >
                        Código enviado a
                      </p>
                      <p
                        className="text-[#FF6B00]"
                        style={{ fontSize: "1rem", fontWeight: 700 }}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Reminder to check email */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-[#2E2E2E]/60 mt-4 text-sm"
              >
                Revisá tu bandeja de entrada y spam 📬
              </motion.p>
            </motion.div>
          </div>

          {/* Pickup Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#e56000] p-6 sm:p-8 text-center">
                <h2
                  className="text-white mb-4 sm:mb-6"
                  style={{
                    fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
                    fontWeight: 600,
                  }}
                >
                  Tu Código de Retiro
                </h2>
                <div className="py-6 px-2 sm:px-4 mb-4">
                  <TokenInput
                    value={pickupCode}
                    variant="display"
                    length={6}
                    disabled
                  />
                </div>
                <p
                  className="text-[#FFF4E6]"
                  style={{ fontSize: "clamp(0.875rem, 2vw, 1rem)" }}
                >
                  Usá este código para desbloquear tu locker en cualquier punto
                  HeyPoint!
                </p>
              </div>
            </Card>
          </motion.div>

          {/* How to Collect Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2
              className="text-[#1C2335] mb-8 text-center"
              style={{ fontSize: "2rem", fontWeight: 700 }}
            >
              Cómo Retirar Tu Pedido
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {howToCollectSteps.map((step, index) => (
                <Card
                  key={index}
                  className="p-6 text-center border-none shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl mb-4">
                    {step.icon}
                  </div>
                  <div
                    className="mb-2 text-[#FF6B00]"
                    style={{ fontSize: "0.875rem", fontWeight: 700 }}
                  >
                    Paso {index + 1}
                  </div>
                  <h3
                    className="text-[#1C2335] mb-3"
                    style={{ fontSize: "1.125rem", fontWeight: 600 }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-[#2E2E2E]"
                    style={{ fontSize: "0.875rem", lineHeight: "1.6" }}
                  >
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => handleNavigation("orders")}
              className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-10 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
              style={{ fontSize: "1.125rem", fontWeight: 600 }}
            >
              <Package className="w-5 h-5 mr-2" />
              Ir a Mis Pedidos
            </Button>
            <Button
              onClick={() => handleNavigation("home")}
              variant="outline"
              className="px-10 py-6 rounded-full border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6] transition-all"
              style={{ fontSize: "1.125rem", fontWeight: 600 }}
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Button>
          </motion.div>

          {/* Continue Shopping */}
          <div className="text-center mt-8">
            <button
              onClick={() => handleNavigation("shop")}
              className="text-[#FF6B00] hover:text-[#e56000] transition-colors inline-flex items-center gap-2"
              style={{ fontSize: "1rem", fontWeight: 500 }}
            >
              <ShoppingBag className="w-5 h-5" />
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
      <BackToTopButton />
    </div>
  );
}
