import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, UserPlus, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FaqItem = {
  icon: React.ComponentType<{ className?: string }>;
  question: string;
  answer: ReactNode;
};

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  // ✅ SSR guard
  if (typeof document === "undefined") return null;

  // WhatsApp: +54 9 11 3147-5522  -> wa.me uses digits only
  const phoneNumber = "5491131475522";

  // URLs
  const storeUrl = "https://www.heypoint.com.ar";
  const videoUrl = "#"; // TODO: Reemplazar por link real al video

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("¡Hola! Necesito ayuda con HeyPoint!.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const faqs: FaqItem[] = [
    {
      icon: UserPlus,
      question: "¿Cómo crear una cuenta en HeyPoint!?",
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
      question: "¿Cómo funciona HeyPoint!?",
      answer: (
        <>
          ¡En tres simples pasos!
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>
              Ingresá a la tienda virtual y seleccioná el producto que deseás.
            </li>
            <li>Pagá con tu billetera virtual vía Mercado Pago.</li>
            <li>
              Acercate a tu HeyPoint!, ingresá el código que recibiste por mail
              y retirás tu compra.
            </li>
          </ol>
          <div className="mt-2">
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#FF6B00] underline underline-offset-2 hover:opacity-80"
            >
              Ver video explicativo
            </a>
          </div>
        </>
      ),
    },
    {
      icon: MessageCircle,
      question: "¿Necesitás contactarte con nosotros?",
      answer: (
        <>
          Hacelo desde aquí:{" "}
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="text-[#FF6B00] underline underline-offset-2 hover:opacity-80"
          >
            contactanos por WhatsApp
          </button>
          .
        </>
      ),
    },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ✅ Backdrop (solo acá cerramos) */}
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[20000]"
            onClick={onClose}
          />

          {/* ✅ Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[20010] flex items-start sm:items-center justify-center p-4"
            // 👇 NO onClick acá, para que no cierre “por accidente”
          >
            <Card
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto border-0 ring-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#ff8534] p-4 sm:p-6 relative rounded-t-3xl">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                <h2
                  className="text-white pr-10 sm:pr-12"
                  style={{
                    fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
                    fontWeight: 700,
                  }}
                >
                  ¿En qué te podemos ayudar?
                </h2>

                <p
                  className="text-white/90 mt-1 sm:mt-2"
                  style={{ fontSize: "0.875rem" }}
                >
                  Respuestas rápidas a preguntas frecuentes
                </p>
              </div>

              {/* FAQ Content */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FFF4E6] flex items-center justify-center">
                        <faq.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B00]" />
                      </div>

                      <div className="flex-1">
                        <h3
                          className="text-[#1C2335] mb-1.5 sm:mb-2"
                          style={{ fontSize: "0.938rem", fontWeight: 600 }}
                        >
                          {faq.question}
                        </h3>

                        <div
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "0.875rem", lineHeight: "1.6" }}
                        >
                          {faq.answer}
                        </div>
                      </div>
                    </div>

                    {index < faqs.length - 1 && (
                      <Separator className="mt-4 sm:mt-5 bg-gray-100" />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer with WhatsApp Button */}
              <div className="bg-[#FFF4E6] p-4 sm:p-6 border-t border-gray-100">
                <p
                  className="text-[#2E2E2E] mb-3 sm:mb-4 text-center"
                  style={{ fontSize: "0.875rem" }}
                >
                  ¿Todavía necesitás ayuda?
                </p>

                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full h-12 sm:h-14 shadow-md"
                  style={{ fontSize: "0.938rem", fontWeight: 600 }}
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Contactanos por WhatsApp
                </Button>

                <p
                  className="text-[#2E2E2E] mt-2 sm:mt-3 text-center"
                  style={{ fontSize: "0.75rem" }}
                >
                  Respondemos en minutos
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
