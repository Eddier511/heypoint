// ModalRoot.tsx — single portal that renders AuthModal with context state
import { lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useModal } from "../contexts/ModalContext";
import { useAuth } from "../contexts/AuthContext";

const AuthModal = lazy(() => import("./AuthModal"));

export default function ModalRoot() {
  const { loginOpen, signupOpen, closeAllModals } = useModal();
  const { login } = useAuth();

  // ensure portal target exists
  const root = typeof document !== "undefined" ? document.body : null;
  if (!root) return null;

  const isOpen = !!(loginOpen || signupOpen);
  if (!isOpen) return null;

  const defaultMode: "login" | "signup" = signupOpen ? "signup" : "login";

  const onClose = () => closeAllModals();
  const onLoginSuccess = (userData?: any) => {
    // Call login with user data (mock data if not provided)
    login({
      email: userData?.email || "user@example.com",
      fullName: userData?.fullName || "User"
    });
    closeAllModals();
  };

  return createPortal(
    <Suspense fallback={null}>
      <AuthModal
        isOpen={isOpen}
        onClose={onClose}
        onLoginSuccess={onLoginSuccess}
        defaultMode={defaultMode}
      />
    </Suspense>,
    root
  );
}
