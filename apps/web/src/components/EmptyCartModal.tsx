import { X, ShoppingBag, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";

interface EmptyCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function EmptyCartModal({ isOpen, onClose, onSignIn, onSignUp }: EmptyCartModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-md bg-white pointer-events-auto rounded-3xl shadow-2xl overflow-hidden relative"
              style={{
                maxHeight: 'calc(100vh - 40px)',
              }}
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Content */}
              <div className="px-6 py-10 md:px-8 md:py-12 text-center">
                {/* Illustration - Empty Cart */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mb-8"
                >
                  <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40">
                    {/* Background Circle */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFF4E6] to-[#FFE8CC] rounded-full opacity-80" />
                    
                    {/* Cart Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag 
                        className="text-[#FF6B00]/40" 
                        style={{ width: '64px', height: '64px', strokeWidth: 1.5 }}
                      />
                    </div>

                    {/* Floating Dots for Visual Interest */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF6B00]/20 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute -bottom-1 -left-1 w-6 h-6 bg-[#FF8534]/20 rounded-full"
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-[#1C2335] mb-3"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700 }}
                >
                  Tu carrito está vacío
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[#2E2E2E]/70 mb-8 max-w-sm mx-auto leading-relaxed"
                  style={{ fontSize: 'clamp(0.938rem, 2.5vw, 1.063rem)' }}
                >
                  Iniciá sesión o creá una cuenta para empezar a comprar en HeyPoint!
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  {/* Primary CTA - Sign In */}
                  <Button
                    onClick={() => {
                      onClose();
                      onSignIn();
                    }}
                    className="
                      w-full h-14 md:h-16 px-6
                      bg-gradient-to-r from-[#FF6B00] to-[#FF8534] 
                      hover:from-[#e56000] hover:to-[#FF6B00]
                      text-white rounded-full
                      shadow-[0_6px_24px_rgba(255,107,0,0.3)]
                      hover:shadow-[0_8px_32px_rgba(255,107,0,0.4)]
                      transition-all duration-200
                      flex items-center justify-center gap-3
                    "
                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.063rem)', fontWeight: 700 }}
                  >
                    <LogIn className="w-5 h-5" />
                    Iniciar sesión
                  </Button>

                  {/* Secondary CTA - Create Account */}
                  <Button
                    onClick={() => {
                      onClose();
                      onSignUp();
                    }}
                    className="
                      w-full h-14 md:h-16 px-6
                      bg-white hover:bg-[#FFF4E6]
                      text-[#FF6B00] hover:text-[#e56000]
                      border-2 border-[#FF6B00]/30 hover:border-[#FF6B00]
                      rounded-full
                      shadow-sm hover:shadow-md
                      transition-all duration-200
                      flex items-center justify-center gap-3
                    "
                    style={{ fontSize: 'clamp(1rem, 2.5vw, 1.063rem)', fontWeight: 600 }}
                  >
                    <UserPlus className="w-5 h-5" />
                    Crear cuenta
                  </Button>
                </motion.div>

                {/* Optional: Small footer text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-[#2E2E2E]/50 mt-6 text-xs md:text-sm"
                >
                  Comprá inteligente, retirá rápido 🚀
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}