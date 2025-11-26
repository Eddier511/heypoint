import { createContext, useContext, useState, ReactNode } from "react";

interface ModalContextType {
  loginOpen: boolean;
  signupOpen: boolean;
  openedAt?: number;
  openLoginModal: () => void;
  openSignupModal: () => void;
  closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ loginOpen: boolean; signupOpen: boolean; openedAt?: number }>({
    loginOpen: false,
    signupOpen: false,
  });

  const openLoginModal = () => {
    console.log("openLoginModal()");
    // Defer by one tick to prevent the opening click from hitting the backdrop
    setTimeout(() => setState({ loginOpen: true, signupOpen: false, openedAt: Date.now() }), 0);
  };

  const openSignupModal = () => {
    console.log('[ModalContext] Opening signup modal');
    // Defer by one tick to prevent the opening click from hitting the backdrop
    setTimeout(() => setState({ loginOpen: false, signupOpen: true, openedAt: Date.now() }), 0);
  };

  const closeAllModals = () => {
    console.log('[ModalContext] Closing all modals');
    setState({ loginOpen: false, signupOpen: false, openedAt: undefined });
  };

  return (
    <ModalContext.Provider value={{ ...state, openLoginModal, openSignupModal, closeAllModals }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    console.error('[ModalContext] useModal called outside of ModalProvider - this should never happen!');
    // Return a dummy object to prevent crashes
    return {
      loginOpen: false,
      signupOpen: false,
      openedAt: undefined,
      openLoginModal: () => console.error('[ModalContext] Cannot open login modal - context unavailable'),
      openSignupModal: () => console.error('[ModalContext] Cannot open signup modal - context unavailable'),
      closeAllModals: () => console.error('[ModalContext] Cannot close modals - context unavailable'),
    };
  }
  return context;
}