import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, UserPlus, Zap } from "lucide-react";
import type { ReactNode, ComponentType } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

type FaqItem = {
  icon: ComponentType<{ className?: string }>;
  question: string;
  answer: ReactNode;
};

export function SupportModal({
  isOpen,
  onClose,
  onNavigate,
}: SupportModalProps) {
  if (typeof document === "undefined") return null;

  const phoneNumber = "5491131475522";
  const storeUrl = "https://www.heypoint.com.ar";

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("¡Hola! Necesito ayuda con Hey!Point.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleVideoClick = () => {
    onClose();
    onNavigate?.("business");
  };

  const faqs: FaqItem[] = [
    {
      icon: UserPlus,
      question: "¿Cómo crear una cuenta en Hey!Point?",
      answer: (
        <>
          Lo podés hacer ingresando a nuestra tienda web en{" "}
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[#FF6B00] underline underline-offset-2 hover:opacity-80"
          >
            heypoint.com.ar
          </a>
          . Completá el formulario con tus datos personales y ¡listo!
        </>
      ),
    },
    {
      icon: Zap,
      question: "¿Cómo funciona Hey!Point?",
      answer: (
        <>
          ¡En tres simples pasos!
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>
              Ingresá a la tienda virtual y seleccioná el producto que deseás.
            </li>
            <li>Pagá con tu billetera virtual vía Mercado Pago.</li>
            <li>
              Acercate a tu Hey!Point, ingresá el código que recibiste por mail
              y retirás tu compra.
            </li>
          </ol>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleVideoClick}
              className="text-[#FF6B00] underline underline-offset-2 hover:opacity-80"
            >
              Ver video explicativo
            </button>
          </div>
        </>
      ),
    },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-black/40 z-[20000]"
            onClick={onClose}
          />

          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.97, y: 14 },
              visible: {
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 380, damping: 28 },
              },
              exit: {
                opacity: 0,
                scale: 0.97,
                y: 8,
                transition: { duration: 0.15, ease: "easeIn" },
              },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[20010] flex items-start sm:items-center justify-center p-4"
          >
            <Card
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto border-0 ring-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#ff8534] p-6 relative rounded-t-3xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Cerrar modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <h2
                  className="text-white pr-12"
                  style={{
                    fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
                    fontWeight: 700,
                  }}
                >
                  ¿En qué te podemos ayudar?
                </h2>

                <p
                  className="text-white/90 mt-2"
                  style={{ fontSize: "0.875rem" }}
                >
                  Respuestas rápidas a preguntas frecuentes
                </p>
              </div>

              <div className="p-6 space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <div className="flex gap-4 rounded-xl p-3 -mx-3 hover:bg-gray-50/80 transition-colors duration-150">
                      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FFF4E6] flex items-center justify-center">
                        <faq.icon className="w-5 h-5 text-[#FF6B00]" />
                      </div>

                      <div className="flex-1">
                        <h3
                          className="text-[#1C2335] mb-1.5"
                          style={{
                            fontSize: "0.938rem",
                            fontWeight: 600,
                          }}
                        >
                          {faq.question}
                        </h3>

                        <div
                          className="text-[#2E2E2E]"
                          style={{
                            fontSize: "0.875rem",
                            lineHeight: "1.65",
                          }}
                        >
                          {faq.answer}
                        </div>
                      </div>
                    </div>

                    {index < faqs.length - 1 && (
                      <Separator className="mt-4 bg-gray-100" />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-[#FFF4E6] px-6 py-5 border-t border-gray-100">
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1aad4e] text-white rounded-full h-13 shadow-sm transition-all duration-150"
                  style={{
                    fontSize: "0.938rem",
                    fontWeight: 600,
                  }}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  ¿Necesitás ayuda? Escribinos
                </Button>

                <p
                  className="text-[#2E2E2E]/60 mt-3 text-center"
                  style={{ fontSize: "0.75rem" }}
                >
                  Respondemos en minutos · Lun–Vie 9 a 18 hs
                </p>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
