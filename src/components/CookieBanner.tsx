// src/components/CookieBanner.tsx
//
// Minimal cookie consent banner.
// – Shown once per browser until the user accepts.
// – Acceptance stored in localStorage under CONSENT_KEY.
// – Navigates to /cookies using the same pushState + popstate pattern
//   the rest of the SPA uses.
// – No focus trap, does not block any flow.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const CONSENT_KEY = "heypoint_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer slightly so it never flashes during the initial paint
    if (!localStorage.getItem(CONSENT_KEY)) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    setVisible(false);
  };

  const goToPolicy = () => {
    window.history.pushState({}, "", "/cookies");
    window.dispatchEvent(new PopStateEvent("popstate"));
    // Don't auto-accept — user clicked to learn more, not to consent
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          // Bottom-center floating card on md+, full-width card on mobile
          className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[520px] z-[9998] pointer-events-none"
          aria-live="polite"
          aria-label="Aviso de cookies"
        >
          <div className="pointer-events-auto bg-[#1C2335]/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Icon + text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">
                🍪
              </span>
              <p className="text-sm text-gray-300 leading-relaxed">
                Usamos cookies para mejorar tu experiencia, mantener tu sesión
                segura y optimizar el funcionamiento de HeyPoint.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={goToPolicy}
                className="text-sm text-[#FF6B00] hover:text-[#e56000] font-medium underline-offset-2 hover:underline transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/60 rounded"
              >
                Ver política
              </button>
              <button
                type="button"
                onClick={accept}
                className="bg-[#FF6B00] hover:bg-[#e56000] active:bg-[#cc5500] text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C2335]"
              >
                Entendido
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
