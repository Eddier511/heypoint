import { useEffect, useRef, useCallback } from 'react';

/**
 * useInactivityTimer Hook
 * 
 * Detecta inactividad del usuario y ejecuta un callback después del tiempo especificado.
 * Solo para Web (Carrito y Checkout).
 * 
 * Eventos que resetean el timer:
 * - mousemove
 * - mousedown
 * - keypress
 * - scroll
 * - touchstart
 * 
 * @param onInactive - Función a ejecutar cuando expire el timer
 * @param timeoutMinutes - Minutos de inactividad (default: 15)
 * @param isEnabled - Si el timer está activo (default: true)
 */

interface UseInactivityTimerOptions {
  onInactive: () => void;
  timeoutMinutes?: number;
  isEnabled?: boolean;
}

export function useInactivityTimer({
  onInactive,
  timeoutMinutes = 15,
  isEnabled = true
}: UseInactivityTimerOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasExpiredRef = useRef(false);

  const resetTimer = useCallback(() => {
    // Si ya expiró, no resetear
    if (hasExpiredRef.current) return;

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si no está habilitado, no crear nuevo timeout
    if (!isEnabled) return;

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      hasExpiredRef.current = true;
      onInactive();
    }, timeoutMinutes * 60 * 1000); // Convertir minutos a milisegundos
  }, [onInactive, timeoutMinutes, isEnabled]);

  useEffect(() => {
    // Si no está habilitado, no hacer nada
    if (!isEnabled) return;

    // Eventos que resetean el timer
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    // Iniciar timer
    resetTimer();

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, isEnabled]);

  // Función para cancelar el timer manualmente
  const cancelTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { cancelTimer };
}
