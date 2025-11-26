// ModalRoot.tsx — single portal that renders AuthModal with context state
import { createPortal } from "react-dom";
import AuthModal from "./AuthModal";
import { useModal } from "../contexts/ModalContext";
import { useAuth } from "../contexts/AuthContext";

export default function ModalRoot() {
  const { loginOpen, signupOpen, closeAllModals } = useModal();
  const { login } = useAuth();

  // ensure portal target exists
  const root = typeof document !== "undefined" ? document.body : null;
  if (!root) return null;

  const isOpen = !!(loginOpen || signupOpen);
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
  const onSignUpSuccess = (email?: string, fullName?: string) => {
    // DO NOT authenticate here - user must verify email and complete profile first
    // The AuthModal will handle the multi-step flow internally
    console.log("✅ Sign Up submitted (not authenticated yet):", email);
  };
  const onGoogleSignUpSuccess = (fullName: string) => {
    // Google sign up is pre-verified, but still needs profile completion
    // The AuthModal will advance to Step 2 (Complete Profile)
    console.log("✅ Google Sign Up (advancing to Complete Profile):", fullName);
  };

  return createPortal(
    <AuthModal
      isOpen={isOpen}
      onClose={onClose}
      onLoginSuccess={onLoginSuccess}
      onSignUpSuccess={onSignUpSuccess}
      onGoogleSignUpSuccess={onGoogleSignUpSuccess}
      defaultMode={defaultMode}
    />,
    root
  );
}