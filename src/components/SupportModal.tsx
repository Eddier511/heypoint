import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Package, CreditCard, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const faqs = [
    {
      icon: Package,
      question: "¿Cómo puedo seguir mi pedido?",
      answer: "Visitá 'Mis Pedidos' desde el menú de tu perfil para ver actualizaciones en tiempo real, estimaciones de entrega y ubicaciones de lockers para todos tus pedidos."
    },
    {
      icon: Truck,
      question: "¿Cuándo llega mi pedido?",
      answer: "¡La mayoría de los pedidos llegan en 24 horas! Vas a recibir una notificación cuando tu pedido esté listo para retirar en el locker HeyPoint! que elegiste."
    },
    {
      icon: CreditCard,
      question: "¿Necesitás confirmación de tu pago?",
      answer: "Todos los comprobantes de pago se envían automáticamente a tu email. También podés ver los detalles de pago en la sección 'Mis Pedidos' de tu cuenta."
    }
  ];

  const handleWhatsAppClick = () => {
    // Replace with actual WhatsApp business number
    const phoneNumber = "1234567890"; // Format: country code + number without +
    const message = encodeURIComponent("¡Hola! Necesito ayuda con mi pedido de HeyPoint!.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <Card
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#FF6B00] to-[#ff8534] p-4 sm:p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                <h2 className="text-white pr-10 sm:pr-12" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 700 }}>
                  ¿En qué te podemos ayudar?
                </h2>
                <p className="text-white/90 mt-1 sm:mt-2" style={{ fontSize: '0.875rem' }}>
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
                        <h3 className="text-[#1C2335] mb-1.5 sm:mb-2" style={{ fontSize: '0.938rem', fontWeight: 600 }}>
                          {faq.question}
                        </h3>
                        <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                          {faq.answer}
                        </p>
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
                <p className="text-[#2E2E2E] mb-3 sm:mb-4 text-center" style={{ fontSize: '0.875rem' }}>
                  ¿Todavía necesitás ayuda?
                </p>
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full h-12 sm:h-14 shadow-md"
                  style={{ fontSize: '0.938rem', fontWeight: 600 }}
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Contactanos por WhatsApp
                </Button>
                <p className="text-[#2E2E2E] mt-2 sm:mt-3 text-center" style={{ fontSize: '0.75rem' }}>
                  Respondemos en minutos
                </p>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}