import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TokenInput } from "../components/TokenInput";
import { motion } from "motion/react";
import { Lock, CheckCircle, XCircle } from "lucide-react";

interface TokenEntryPageProps {
  onNavigate?: (page: string) => void;
  expectedToken?: string;
}

export function TokenEntryPage({ 
  onNavigate,
  expectedToken = "A3X9K2" 
}: TokenEntryPageProps) {
  const [tokenValue, setTokenValue] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTokenChange = (value: string) => {
    setTokenValue(value);
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleTokenComplete = (value: string) => {
    // Auto-verify when all 6 characters are entered
    verifyToken(value);
  };

  const verifyToken = (token: string) => {
    setIsVerifying(true);
    setError("");

    // Simulate API call to verify token
    setTimeout(() => {
      if (token.toUpperCase() === expectedToken.toUpperCase()) {
        setIsSuccess(true);
        setTimeout(() => {
          // Navigate to success or unlock locker
          onNavigate?.("success");
        }, 2000);
      } else {
        setError("Código inválido. Por favor, verificá tu código e intentá nuevamente.");
        setTokenValue("");
      }
      setIsVerifying(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (tokenValue.length !== 6) {
      setError("El código debe tener 6 caracteres");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(tokenValue.toUpperCase())) {
      setError("Ingresá solo letras y números");
      return;
    }

    verifyToken(tokenValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C2335] to-[#2E2E2E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF6B00] to-[#e56000] p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4"
            >
              {isSuccess ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Lock className="w-10 h-10 text-white" />
              )}
            </motion.div>
            <h1 className="text-white mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700 }}>
              {isSuccess ? "¡Código Verificado!" : "Ingresá tu Código"}
            </h1>
            <p className="text-white/90" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
              {isSuccess 
                ? "Tu locker se abrirá en unos momentos" 
                : "Ingresá el código de 6 caracteres que recibiste por email"
              }
            </p>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 bg-[#B6E322] rounded-full mb-6">
                  <CheckCircle className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  ¡Verificación Exitosa!
                </h2>
                <p className="text-[#2E2E2E]" style={{ fontSize: '1rem' }}>
                  Retirá tu pedido del locker que se está abriendo.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Token Input */}
                <div className="mb-8">
                  <TokenInput
                    value={tokenValue}
                    onChange={handleTokenChange}
                    onComplete={handleTokenComplete}
                    error={error}
                    disabled={isVerifying}
                    autoFocus={true}
                    length={6}
                    showExpiration={true}
                    expirationTime={120}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={tokenValue.length !== 6 || isVerifying}
                  className="w-full h-14 bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '1.125rem', fontWeight: 600 }}
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>

                {/* Help Text */}
                <div className="mt-8 text-center">
                  <p className="text-[#2E2E2E]/60 mb-4" style={{ fontSize: '0.875rem' }}>
                    ¿No recibiste tu código?
                  </p>
                  <button
                    onClick={() => {
                      // Handle resend logic
                      console.log("Resending code...");
                    }}
                    className="text-[#FF6B00] hover:text-[#e56000] transition-colors"
                    style={{ fontSize: '0.938rem', fontWeight: 600 }}
                  >
                    Reenviar código por email
                  </button>
                </div>

                {/* Demo Helper */}
                <div className="mt-8 p-4 bg-[#FFF4E6] rounded-xl">
                  <p className="text-[#2E2E2E] text-center mb-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    DEMO - Código de prueba:
                  </p>
                  <p className="text-[#FF6B00] text-center tracking-widest" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {expectedToken}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Back Button */}
        {!isSuccess && (
          <div className="text-center mt-6">
            <button
              onClick={() => onNavigate?.("home")}
              className="text-white/80 hover:text-white transition-colors"
              style={{ fontSize: '0.938rem' }}
            >
              ← Volver al inicio
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
