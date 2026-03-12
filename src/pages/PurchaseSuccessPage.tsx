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
  Package,
  Home,
  ShoppingBag,
  Sparkles,
  Copy,
  Check,
  KeyRound,
  Navigation,
} from "lucide-react";
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
  const hasCleared = useRef(false);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // CRITICAL: Scroll to top immediately when page loads
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
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup resend interval on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    };
  }, []);

  const handleNavigation = (page: string) => {
    if (onNavigate) onNavigate(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard
        .writeText(pickupCode)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(pickupCode));
    } catch {
      fallbackCopy(pickupCode);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleResendEmail = () => {
    if (resendDisabled) return;
    setResendDisabled(true);
    setResendCountdown(60);
    resendIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (resendIntervalRef.current)
            clearInterval(resendIntervalRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="success"
        isLoggedIn={isLoggedIn}
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-4xl">
          {/* ── SECTION 1: Pedido Confirmado ── */}
          <div className="relative">
            {/* Confetti */}
            <AnimatePresence>
              {showConfetti && (
                <>
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
              className="text-center mb-10 relative z-10"
            >
              {/* Check Circle Icon */}
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
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#FF6B00]"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#FF6B00]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
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
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
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
                  animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
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

              <motion.h1
                className="text-[#1C2335]"
                style={{ fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 700 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              >
                ¡Pedido Confirmado!
              </motion.h1>
            </motion.div>
          </div>

          {/* ── SECTION 2: Tu Código de Retiro — Focal Point ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-10"
          >
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-br from-[#FF6B00] to-[#d95500] px-6 sm:px-10 py-10 text-center">
                <h2
                  className="text-white mb-10"
                  style={{
                    fontSize: "clamp(1.25rem, 3vw, 1.625rem)",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                  }}
                >
                  Tu Código de Retiro
                </h2>

                {/* Code display */}
                <div className="mb-8">
                  <TokenInput
                    value={pickupCode}
                    variant="display"
                    length={6}
                    disabled
                  />
                </div>

                {/* Copy button */}
                <motion.button
                  onClick={handleCopyCode}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white/80 text-white hover:bg-white/15 transition-all mb-10"
                  style={{ fontWeight: 600, fontSize: "0.9375rem" }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Código copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar código
                    </>
                  )}
                </motion.button>

                {/* Helper texts */}
                <div className="space-y-3 max-w-sm mx-auto">
                  <p
                    className="text-white/95"
                    style={{ fontSize: "0.9375rem", lineHeight: "1.6" }}
                  >
                    <span style={{ fontWeight: 700 }}>Guardá este código.</span>
                    <br />
                    Lo vas a usar para desbloquear los módulos del stand de
                    HeyPoint!
                  </p>
                  <p
                    className="text-white/70"
                    style={{ fontSize: "0.8125rem", lineHeight: "1.5" }}
                  >
                    También podés encontrar este código en Mis Pedidos.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── SECTION 3: Mensaje de agradecimiento + Email ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center mb-12"
          >
            <Card className="border-2 border-[#FF6B00]/20 shadow-lg rounded-2xl overflow-hidden bg-white w-full max-w-lg">
              <div className="px-7 py-7 text-center">
                {/* Thank you — two lines */}
                <p
                  className="text-[#FF6B00] mb-1"
                  style={{ fontSize: "1.125rem", fontWeight: 700 }}
                >
                  Gracias, {userName}
                </p>
                <p
                  className="text-[#1C2335] mb-6"
                  style={{ fontSize: "1rem", fontWeight: 500 }}
                >
                  Tu compra fue procesada correctamente.
                </p>

                <div className="border-t border-gray-100 pt-6">
                  {/* Email centered */}
                  <div className="mb-4">
                    <p
                      className="text-[#2E2E2E]/55 mb-1"
                      style={{ fontSize: "0.8125rem", fontWeight: 500 }}
                    >
                      Código enviado a
                    </p>
                    <p
                      className="text-[#1C2335]"
                      style={{ fontSize: "1rem", fontWeight: 700 }}
                    >
                      {userEmail}
                    </p>
                  </div>

                  {/* Helper + resend — stacked centered */}
                  <p
                    className="text-[#2E2E2E]/60 mb-2"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Revisá tu bandeja de entrada o spam.
                  </p>
                  <button
                    onClick={handleResendEmail}
                    disabled={resendDisabled}
                    className="text-[#FF6B00] hover:text-[#e56000] disabled:text-[#2E2E2E]/35 disabled:cursor-not-allowed transition-colors"
                    style={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    {resendDisabled
                      ? `Reenviar correo (${resendCountdown}s)`
                      : "¿No recibiste el código? Reenviar correo"}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── SECTION 4: Cómo Retirar Tu Pedido ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <h2
              className="text-[#1C2335] mb-8 text-center"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 700 }}
            >
              Cómo Retirar Tu Pedido
            </h2>
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {/* Step 1 */}
              <Card className="p-7 flex flex-col items-center text-center border-none shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl mb-4 flex-shrink-0">
                  <Navigation className="w-8 h-8" />
                </div>
                <div
                  className="mb-2 text-[#FF6B00]"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Paso 1
                </div>
                <h3
                  className="text-[#1C2335] mb-3"
                  style={{ fontSize: "1.0625rem", fontWeight: 600 }}
                >
                  Acercate a tu HeyPoint!
                </h3>
                <p
                  className="text-[#2E2E2E]/65"
                  style={{ fontSize: "0.875rem", lineHeight: "1.65" }}
                >
                  Ubicá la pantalla del stand donde podrás ingresar tu código.
                </p>
              </Card>

              {/* Step 2 */}
              <Card className="p-7 flex flex-col items-center text-center border-none shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl mb-4 flex-shrink-0">
                  <KeyRound className="w-8 h-8" />
                </div>
                <div
                  className="mb-2 text-[#FF6B00]"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Paso 2
                </div>
                <h3
                  className="text-[#1C2335] mb-3"
                  style={{ fontSize: "1.0625rem", fontWeight: 600 }}
                >
                  Ingresá tu código
                </h3>
                <p
                  className="text-[#2E2E2E]/65"
                  style={{ fontSize: "0.875rem", lineHeight: "1.65" }}
                >
                  Ingresá tu código de retiro para desbloquear el módulo
                  correspondiente.
                </p>
                <div className="mt-4 inline-flex items-center bg-[#FFF4E6] rounded-full px-3 py-1.5">
                  <span
                    className="text-[#FF6B00]"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    Solo podés desbloquear un módulo a la vez.
                  </span>
                </div>
              </Card>

              {/* Step 3 */}
              <Card className="p-7 flex flex-col items-center text-center border-none shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl mb-4 flex-shrink-0">
                  <Package className="w-8 h-8" />
                </div>
                <div
                  className="mb-2 text-[#FF6B00]"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Paso 3
                </div>
                <h3
                  className="text-[#1C2335] mb-3"
                  style={{ fontSize: "1.0625rem", fontWeight: 600 }}
                >
                  Retirá tu compra
                </h3>
                <p
                  className="text-[#2E2E2E]/65"
                  style={{ fontSize: "0.875rem", lineHeight: "1.65" }}
                >
                  Tomá tus productos y cerrá el módulo para finalizar la
                  operación.
                </p>
              </Card>
            </div>
          </motion.div>

          {/* ── Bottom Action Buttons ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Button
              onClick={() => handleNavigation("orders")}
              className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-10 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
              style={{ fontSize: "1.0625rem", fontWeight: 600 }}
            >
              <Package className="w-5 h-5 mr-2" />
              Ir a Mis Pedidos
            </Button>
            <Button
              onClick={() => handleNavigation("home")}
              variant="outline"
              className="px-10 py-6 rounded-full border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6] transition-all"
              style={{ fontSize: "1.0625rem", fontWeight: 600 }}
            >
              <Home className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Button>
          </motion.div>

          {/* Tertiary: Seguir Comprando */}
          <div className="text-center mt-2 pb-6">
            <button
              onClick={() => handleNavigation("shop")}
              className="text-[#FF6B00] hover:text-[#e56000] transition-colors inline-flex items-center gap-2"
              style={{ fontSize: "0.9375rem", fontWeight: 500 }}
            >
              <ShoppingBag className="w-4 h-4" />
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
