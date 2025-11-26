import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface InactivityExpirationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

/**
 * InactivityExpirationModal Component
 *
 * Modal que se muestra cuando el carrito expira por inactividad.
 * Solo para Web (Carrito y Checkout).
 *
 * Diseño:
 * - Premium, limpio, no alarmista
 * - Fondo blanco con sombra suave
 * - Icono informativo discreto
 * - Tipografía gris oscuro
 * - Botón naranja HeyPoint
 *
 * Comportamiento:
 * - No se puede cerrar con ESC o click fuera (modal blocking)
 * - Solo se cierra al confirmar y volver a la tienda
 *
 * @param isOpen - Si el modal está visible
 * @param onConfirm - Callback al confirmar (vacía carrito y va a tienda)
 */
export function InactivityExpirationModal({
  isOpen,
  onConfirm,
}: InactivityExpirationModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-md p-0 border-none shadow-2xl rounded-3xl overflow-hidden bg-white"
        // Evitar cierre con ESC o click fuera
        onEscapeKeyDown={(e: { preventDefault: () => any }) =>
          e.preventDefault()
        }
        onPointerDownOutside={(e: { preventDefault: () => any }) =>
          e.preventDefault()
        }
        onInteractOutside={(e: { preventDefault: () => any }) =>
          e.preventDefault()
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-8 md:p-10"
        >
          {/* Icono Informativo */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full bg-[#FFF4E6] flex items-center justify-center"
              style={{
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.15)",
              }}
            >
              <AlertCircle className="w-8 h-8 text-[#FF6B00]" strokeWidth={2} />
            </div>
          </div>

          {/* Título */}
          <h2
            className="text-center text-[#1C2335] mb-3"
            style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 }}
          >
            Tu carrito expiró por inactividad
          </h2>

          {/* Subtítulo */}
          <p
            className="text-center text-[#4A4A4A] mb-8"
            style={{ fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }}
          >
            Liberamos el stock para que otros usuarios puedan comprar. Podés
            armar tu pedido nuevamente.
          </p>

          {/* Botón Principal */}
          <Button
            onClick={onConfirm}
            className="w-full py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
            style={{
              fontSize: "1.063rem",
              fontWeight: 600,
              backgroundColor: "#FF6B00",
              color: "white",
            }}
          >
            Volver a la tienda
          </Button>

          {/* Mensaje adicional pequeño */}
          <p
            className="text-center text-[#999] mt-6"
            style={{ fontSize: "0.813rem", fontWeight: 400 }}
          >
            Tus productos favoritos te esperan en la tienda
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
