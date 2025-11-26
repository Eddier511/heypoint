import { useEffect } from "react";
import { useModal } from "../contexts/ModalContext";

/**
 * GlobalModalBridge listens to global custom events and triggers modal context handlers.
 * This provides a fallback mechanism when context is not available or for cross-component communication.
 */
export function GlobalModalBridge() {
  const modalContext = useModal();

  useEffect(() => {
    const handleOpenLogin = (event: Event) => {
      console.log('[GlobalModalBridge] Received heypoint:open-login event');
      if (modalContext?.openLoginModal) {
        modalContext.openLoginModal();
      } else {
        console.error('[GlobalModalBridge] Modal context not available');
      }
    };

    const handleOpenSignup = (event: Event) => {
      console.log('[GlobalModalBridge] Received heypoint:open-signup event');
      if (modalContext?.openSignupModal) {
        modalContext.openSignupModal();
      } else {
        console.error('[GlobalModalBridge] Modal context not available');
      }
    };

    window.addEventListener('heypoint:open-login', handleOpenLogin);
    window.addEventListener('heypoint:open-signup', handleOpenSignup);

    console.log('[GlobalModalBridge] Event listeners registered');

    return () => {
      window.removeEventListener('heypoint:open-login', handleOpenLogin);
      window.removeEventListener('heypoint:open-signup', handleOpenSignup);
      console.log('[GlobalModalBridge] Event listeners cleaned up');
    };
  }, [modalContext]);

  return null; // This component doesn't render anything
}

/**
 * Helper function to trigger login modal via event (fallback mechanism)
 */
export function triggerLoginModal() {
  console.log('[GlobalModalBridge] Dispatching heypoint:open-login event');
  window.dispatchEvent(new CustomEvent('heypoint:open-login'));
}

/**
 * Helper function to trigger signup modal via event (fallback mechanism)
 */
export function triggerSignupModal() {
  console.log('[GlobalModalBridge] Dispatching heypoint:open-signup event');
  window.dispatchEvent(new CustomEvent('heypoint:open-signup'));
}
