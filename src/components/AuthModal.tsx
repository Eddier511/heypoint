// src/components/AuthModal.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Chrome,
  ArrowLeft,
  CheckCircle2,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

import { useAuth } from "../contexts/AuthContext";

type SignUpStep = "form" | "verifyEmail" | "completeProfile";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData?: any) => void;
  defaultMode?: "login" | "signup";
}

const PENDING_EMAIL_KEY = "heypoint_pending_email";
const PENDING_NAME_KEY = "heypoint_pending_name";
const PENDING_PROFILE_KEY = "heypoint_pending_profile"; // ✅ nuevo

const calculatePasswordStrength = (
  password: string,
): { strength: "weak" | "medium" | "strong"; score: number } => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) return { strength: "weak", score };
  if (score <= 75) return { strength: "medium", score };
  return { strength: "strong", score };
};

const checkPasswordRequirements = (password: string) => ({
  length: password.length >= 8,
  case: /[a-z]/.test(password) && /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAge16(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const birth = new Date(dateStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 16;
}

function normalizeDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

async function saveProfileToBackend(payload: any, idToken: string) {
  const base =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000/api";

  const url = `${base}/customers/profile`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `No se pudo guardar el perfil (${res.status}). ${text || ""}`.trim(),
    );
  }

  return res.json().catch(() => ({}));
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultMode = "login",
}: AuthModalProps) {
  const {
    user: sessionUser, // ✅ para recuperar email/nombre si el padre cierra el modal
    loginWithEmail,
    signupWithEmail,
    startGoogleOAuth,
    sendResetPassword,
    refreshEmailVerification,
    getIdToken,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultMode);
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("form");

  const [readyToClose, setReadyToClose] = useState(false);
  const [step2Dirty, setStep2Dirty] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string>("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingFullName, setPendingFullName] = useState("");
  const [verificationCountdown, setVerificationCountdown] = useState(45);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");

  const pickupPoint = "Urb. Valle Arriba";

  // ✅ restore state
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(defaultMode);
    setGlobalError("");
    setEmailError("");
    setPasswordError("");
    setLoading(false);
    setShowForgotPassword(false);
    setForgotPasswordSent(false);
    setForgotPasswordError("");
    setStep2Dirty(false);

    const savedEmail = localStorage.getItem(PENDING_EMAIL_KEY);
    const savedName = localStorage.getItem(PENDING_NAME_KEY);
    const pendingProfile = localStorage.getItem(PENDING_PROFILE_KEY) === "1";

    setPhone("");
    setDni("");
    setBirthDate("");
    setApartmentNumber("");

    // ✅ si Google ya autenticó y el padre cerró el modal, volvemos a Paso 2 automáticamente
    if (pendingProfile) {
      const email = sessionUser?.email || savedEmail || "";
      const name = sessionUser?.fullName || savedName || "";
      setPendingEmail(email);
      setPendingFullName(name);
      setSignUpStep("completeProfile");
      setActiveTab("signup");
      return;
    }

    if (defaultMode === "signup" && savedEmail) {
      setPendingEmail(savedEmail);
      setPendingFullName(savedName || "");
      setSignUpStep("verifyEmail");
      setVerificationCountdown(45);
      setIsResendEnabled(false);
    } else {
      setSignUpStep("form");
    }
  }, [isOpen, defaultMode, sessionUser]);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => setReadyToClose(true));
    return () => {
      cancelAnimationFrame(id);
      setReadyToClose(false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (signUpStep !== "verifyEmail") return;
    if (isResendEnabled) return;
    if (verificationCountdown <= 0) return;

    const t = setTimeout(() => {
      setVerificationCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsResendEnabled(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearTimeout(t);
  }, [signUpStep, verificationCountdown, isResendEnabled]);

  const guardedClose = useCallback(() => {
    if (signUpStep === "completeProfile" && step2Dirty) {
      setShowConfirmLeave(true);
      return;
    }
    onClose();
  }, [onClose, signUpStep, step2Dirty]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") guardedClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, guardedClose]);

  const onBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!readyToClose) return;
    if (e.target === e.currentTarget) guardedClose();
  };

  const strengthInfo = useMemo(
    () => calculatePasswordStrength(signUpPassword),
    [signUpPassword],
  );
  const requirements = useMemo(
    () => checkPasswordRequirements(signUpPassword),
    [signUpPassword],
  );

  const openGmail = () => window.open("https://mail.google.com", "_blank");

  // ✅ Google login/signup (FIX: si es nuevo, NO cerrar modal aunque esté en login tab)
  const handleGoogle = async () => {
    try {
      setGlobalError("");
      setLoading(true);

      const { user, isNewUser } = await startGoogleOAuth();

      // ✅ Si es NUEVO => Paso 2 siempre (aunque el tab esté en login)
      if (isNewUser) {
        localStorage.setItem(PENDING_PROFILE_KEY, "1");
        localStorage.setItem(PENDING_EMAIL_KEY, user.email);
        localStorage.setItem(PENDING_NAME_KEY, user.fullName || "");

        setActiveTab("signup");
        setPendingEmail(user.email);
        setPendingFullName(user.fullName);
        setSignUpStep("completeProfile");
        setStep2Dirty(false);
        return;
      }

      // ✅ Si NO es nuevo => login normal y cerrar
      onLoginSuccess(user);
      onClose();
    } catch (e: any) {
      setGlobalError(e?.message || "No se pudo iniciar con Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGlobalError("");
      setLoading(true);

      if (!validateEmail(loginEmail)) {
        setGlobalError("Ingresá un correo válido.");
        return;
      }

      const u = await loginWithEmail(loginEmail, loginPassword);
      onLoginSuccess(u);
      onClose();
    } catch (e: any) {
      setGlobalError(
        e?.message || "No se pudo iniciar sesión. Revisá tus credenciales.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setGlobalError("");

    if (!validateEmail(signUpEmail)) {
      setEmailError("Ingresá un correo electrónico válido");
      return;
    }

    const { strength } = calculatePasswordStrength(signUpPassword);
    if (strength === "weak") {
      setPasswordError(
        "La contraseña es muy débil. Cumplí con todos los requisitos.",
      );
      return;
    }

    try {
      setLoading(true);

      const user = await signupWithEmail(
        signUpFullName,
        signUpEmail,
        signUpPassword,
      );

      localStorage.setItem(PENDING_EMAIL_KEY, user.email);
      localStorage.setItem(PENDING_NAME_KEY, signUpFullName);

      setPendingEmail(user.email);
      setPendingFullName(signUpFullName);
      setSignUpStep("verifyEmail");
      setVerificationCountdown(45);
      setIsResendEnabled(false);
    } catch (e: any) {
      setGlobalError(e?.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    try {
      setGlobalError("");
      setLoading(true);

      const verified = await refreshEmailVerification();
      if (!verified) {
        setGlobalError("Todavía no está verificado. Revisá tu correo y Spam.");
        return;
      }

      setSignUpStep("completeProfile");
      setStep2Dirty(false);
    } catch (e: any) {
      setGlobalError(
        e?.message || "No se pudo comprobar la verificación. Intentá de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setGlobalError("");
      setLoading(true);
      setVerificationCountdown(45);
      setIsResendEnabled(false);
      openGmail();
    } catch (e: any) {
      setGlobalError(e?.message || "No se pudo reenviar.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    localStorage.removeItem(PENDING_EMAIL_KEY);
    localStorage.removeItem(PENDING_NAME_KEY);
    localStorage.removeItem(PENDING_PROFILE_KEY);
    setPendingEmail("");
    setPendingFullName("");
    setSignUpStep("form");
    setActiveTab("signup");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError("");
    setGlobalError("");

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordError("Por favor, ingresá un email válido");
      return;
    }

    try {
      setLoading(true);
      await sendResetPassword(forgotPasswordEmail);
      setForgotPasswordSent(true);
    } catch (err: any) {
      setForgotPasswordError(
        err?.message || "No se pudo enviar el email de recuperación.",
      );
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setForgotPasswordSent(false);
    setForgotPasswordError("");
    setActiveTab("login");
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setDniError("");
    setBirthDateError("");
    setGlobalError("");

    let hasError = false;

    const phoneDigits = normalizeDigits(phone);
    if (!phoneDigits || phoneDigits.length < 8) {
      setPhoneError("Ingresá un teléfono válido (mínimo 8 dígitos)");
      hasError = true;
    }

    const dniTrim = (dni || "").trim();
    if (!dniTrim || dniTrim.length < 7 || dniTrim.length > 15) {
      setDniError("DNI debe tener entre 7 y 15 caracteres");
      hasError = true;
    }

    if (!birthDate) {
      setBirthDateError("La fecha de nacimiento es requerida");
      hasError = true;
    } else if (!validateAge16(birthDate)) {
      setBirthDateError("Debés tener al menos 16 años");
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const finalUser = {
        email: pendingEmail,
        fullName: pendingFullName || "User",
        phone: phoneDigits,
        dni: dniTrim,
        birthDate,
        apartmentNumber: (apartmentNumber || "").trim(),
        pickupPoint,
      };

      const idToken = await getIdToken();
      if (idToken) await saveProfileToBackend(finalUser, idToken);

      // ✅ limpiar flags
      localStorage.removeItem(PENDING_PROFILE_KEY);
      localStorage.removeItem(PENDING_EMAIL_KEY);
      localStorage.removeItem(PENDING_NAME_KEY);

      onLoginSuccess(finalUser);
      setStep2Dirty(false);
      onClose();
    } catch (err: any) {
      setGlobalError(
        err?.message ||
          "No se pudo guardar el perfil. Revisá el endpoint del backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromCompleteProfile = () => {
    // limpia errores y estado “dirty”
    setGlobalError("");
    setPhoneError("");
    setDniError("");
    setBirthDateError("");
    setStep2Dirty(false);

    // opcional: limpiar inputs del step 2
    setPhone("");
    setDni("");
    setBirthDate("");
    setApartmentNumber("");

    // volver al inicio del modal
    setSignUpStep("form");
    setActiveTab("signup"); // o "login" si querés que vuelva a login
  };

  // =========================
  // UI (la tuya, igual)
  // =========================
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[8px] z-[9000]"
            onMouseDown={onBackdropMouseDown}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col my-auto"
              style={{ maxHeight: "min(88vh, 900px)" }}
            >
              <button
                onClick={guardedClose}
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2E2E2E] flex items-center justify-center transition-all hover:scale-110"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              {!!globalError && (
                <div className="px-6 md:px-8 pt-5">
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {globalError}
                  </div>
                </div>
              )}

              {/* STEP 1: FORM */}
              {signUpStep === "form" && !showForgotPassword && (
                <>
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <h2 className="font-bold text-2xl">
                      ¡Bienvenido a HeyPoint!
                    </h2>
                    <p className="mt-2 text-[#FFF4E6]">
                      {activeTab === "login"
                        ? "Iniciá sesión para seguir comprando"
                        : "Creá tu cuenta para empezar"}
                    </p>
                  </div>

                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => {
                      setActiveTab(v as any);
                      setGlobalError("");
                    }}
                    className="w-full flex flex-col flex-1 overflow-hidden"
                  >
                    <TabsList className="flex-shrink-0 w-full grid grid-cols-2 h-12 md:h-14 text-sm md:text-base bg-[#FFF4E6] rounded-none border-b border-gray-200">
                      <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B00] rounded-none"
                        style={{ fontWeight: 600 }}
                      >
                        Iniciar sesión
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B00] rounded-none"
                        style={{ fontWeight: 600 }}
                      >
                        Crear cuenta
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto">
                      {/* Google */}
                      <div className="px-6 md:px-8 pt-8 pb-2">
                        <Button
                          onClick={handleGoogle}
                          variant="outline"
                          type="button"
                          disabled={loading}
                          className="w-full mb-6 py-6 rounded-2xl border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] transition-all group"
                          style={{ fontWeight: 600 }}
                        >
                          <Chrome className="w-5 h-5 mr-3 text-gray-600 group-hover:text-[#FF6B00]" />
                          <span className="text-[#1C2335]">
                            {loading ? "Procesando..." : "Continuar con Google"}
                          </span>
                        </Button>

                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 bg-white text-gray-500 text-xs font-medium">
                              o continuar con email
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* LOGIN TAB */}
                      <TabsContent
                        value="login"
                        className="mt-0 px-6 md:px-8 pb-8"
                      >
                        <form onSubmit={handleLogin} className="space-y-6">
                          <div>
                            <Label className="text-[#1C2335] mb-2 block font-semibold">
                              Correo electrónico
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="tu.email@ejemplo.com"
                                className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-[#1C2335] mb-2 block font-semibold">
                              Contraseña
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type={showLoginPassword ? "text" : "password"}
                                value={loginPassword}
                                onChange={(e) =>
                                  setLoginPassword(e.target.value)
                                }
                                placeholder="Ingresá tu contraseña"
                                className="pl-12 pr-12 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword((s) => !s)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00]"
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-[#FF6B00] hover:text-[#e56000] underline-offset-2 hover:underline text-sm font-semibold"
                            >
                              ¿Olvidaste tu contraseña?
                            </button>
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg"
                            style={{ fontWeight: 600 }}
                          >
                            {loading ? "Ingresando..." : "Iniciar sesión"}
                          </Button>

                          <p className="text-center text-gray-500 text-sm">
                            ¿No tenés cuenta?{" "}
                            <button
                              type="button"
                              onClick={() => setActiveTab("signup")}
                              className="text-[#FF6B00] hover:text-[#e56000] font-semibold"
                            >
                              Creá una ahora
                            </button>
                          </p>
                        </form>
                      </TabsContent>

                      {/* SIGNUP TAB */}
                      <TabsContent
                        value="signup"
                        className="mt-0 px-6 md:px-8 pb-8"
                      >
                        <form onSubmit={handleSignup} className="space-y-6">
                          <div>
                            <Label className="text-[#1C2335] mb-2 block font-semibold">
                              Nombre completo
                            </Label>
                            <div className="relative">
                              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type="text"
                                value={signUpFullName}
                                onChange={(e) =>
                                  setSignUpFullName(e.target.value)
                                }
                                placeholder="Juan Pérez"
                                className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-[#1C2335] mb-2 block font-semibold">
                              Correo electrónico
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type="email"
                                value={signUpEmail}
                                onChange={(e) => {
                                  setSignUpEmail(e.target.value);
                                  setEmailError("");
                                }}
                                placeholder="tu.email@ejemplo.com"
                                className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                  emailError
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                }`}
                                required
                              />
                            </div>
                            {emailError && (
                              <p className="text-red-500 mt-2 text-sm font-medium">
                                {emailError}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label className="text-[#1C2335] mb-2 block font-semibold">
                              Contraseña
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                type={showSignUpPassword ? "text" : "password"}
                                value={signUpPassword}
                                onChange={(e) => {
                                  setSignUpPassword(e.target.value);
                                  setPasswordError("");
                                }}
                                placeholder="Creá una contraseña segura"
                                className={`pl-12 pr-12 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                  passwordError
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                }`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignUpPassword((s) => !s)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00]"
                              >
                                {showSignUpPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>

                            {signUpPassword && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-600 text-xs font-semibold">
                                    Seguridad de la contraseña
                                  </span>
                                  <span
                                    className={`text-xs font-bold ${
                                      strengthInfo.strength === "weak"
                                        ? "text-red-500"
                                        : strengthInfo.strength === "medium"
                                          ? "text-[#FF6B00]"
                                          : "text-green-600"
                                    }`}
                                  >
                                    {strengthInfo.strength === "weak"
                                      ? "DÉBIL"
                                      : strengthInfo.strength === "medium"
                                        ? "MEDIA"
                                        : "FUERTE"}
                                  </span>
                                </div>

                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${strengthInfo.score}%`,
                                    }}
                                    transition={{ duration: 0.25 }}
                                    className={`h-full ${
                                      strengthInfo.strength === "weak"
                                        ? "bg-red-500"
                                        : strengthInfo.strength === "medium"
                                          ? "bg-[#FF6B00]"
                                          : "bg-green-600"
                                    }`}
                                  />
                                </div>

                                <div className="mt-3 space-y-2 bg-[#FFF4E6] p-3 rounded-2xl border border-[#FF6B00]/10">
                                  {[
                                    {
                                      key: "length",
                                      text: "Al menos 8 caracteres",
                                    },
                                    {
                                      key: "case",
                                      text: "Mayúsculas y minúsculas",
                                    },
                                    {
                                      key: "number",
                                      text: "Al menos un número",
                                    },
                                    {
                                      key: "special",
                                      text: "Un carácter especial (@, #, $, etc.)",
                                    },
                                  ].map(({ key, text }) => {
                                    const met =
                                      requirements[
                                        key as keyof typeof requirements
                                      ];
                                    return (
                                      <div
                                        key={key}
                                        className="flex items-center gap-2"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                            met ? "bg-green-600" : "bg-gray-300"
                                          }`}
                                        >
                                          {met && (
                                            <Check className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                        <span
                                          className={`text-xs ${
                                            met
                                              ? "text-[#1C2335] font-semibold"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {text}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {passwordError && (
                              <p className="text-red-500 mt-2 text-sm font-semibold">
                                {passwordError}
                              </p>
                            )}
                          </div>

                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg"
                            style={{ fontWeight: 600 }}
                          >
                            {loading ? "Creando..." : "Crear cuenta"}
                          </Button>

                          <p className="text-center text-gray-500 text-sm">
                            ¿Ya tenés cuenta?{" "}
                            <button
                              type="button"
                              onClick={() => setActiveTab("login")}
                              className="text-[#FF6B00] hover:text-[#e56000] font-semibold"
                            >
                              Iniciá sesión
                            </button>
                          </p>
                        </form>
                      </TabsContent>
                    </div>
                  </Tabs>
                </>
              )}

              {/* STEP 2: VERIFY EMAIL */}
              {signUpStep === "verifyEmail" && (
                <div className="flex flex-col h-full">
                  <div className="bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 py-8 text-center relative overflow-hidden rounded-t-3xl">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.15,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4"
                    >
                      <Mail className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-white font-bold text-2xl">
                      Verificá tu Email
                    </h2>
                    <p className="text-white/90 mt-2">
                      Te enviamos un enlace a:{" "}
                      <span className="font-semibold break-all">
                        {pendingEmail}
                      </span>
                    </p>
                  </div>

                  <div className="px-6 sm:px-8 py-6 space-y-4 overflow-y-auto">
                    <p className="text-[#2E2E2E] text-center">
                      Abrí tu correo y hacé clic en el enlace de verificación.
                      Luego volvés acá y tocás “Ya verifiqué”.
                    </p>

                    <div className="space-y-3">
                      <Button
                        onClick={openGmail}
                        className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF4E00] hover:from-[#e56000] hover:to-[#e04500] text-white min-h-[3.5rem] rounded-full shadow-lg"
                        style={{ fontWeight: 600 }}
                        type="button"
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Abrir Gmail
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        onClick={handleCheckVerified}
                        disabled={loading}
                        className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white min-h-[3.5rem] rounded-full shadow"
                        style={{ fontWeight: 600 }}
                        type="button"
                      >
                        {loading ? "Comprobando..." : "Ya verifiqué mi email"}
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>

                      <Button
                        onClick={handleResend}
                        disabled={!isResendEnabled || loading}
                        className={`w-full min-h-[3.5rem] rounded-full border-2 ${
                          isResendEnabled
                            ? "bg-white border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6]"
                            : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        }`}
                        style={{ fontWeight: 600 }}
                        type="button"
                      >
                        {isResendEnabled ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reenviar verificación
                          </>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5" />
                            Reenviar en {verificationCountdown}s
                          </span>
                        )}
                      </Button>

                      <Button
                        onClick={handleChangeEmail}
                        variant="ghost"
                        className="w-full min-h-[3.25rem] rounded-full text-[#FF6B00] hover:bg-[#FFF4E6]"
                        type="button"
                      >
                        Usar otro email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COMPLETE PROFILE */}
              {signUpStep === "completeProfile" && (
                <>
                  <div className="bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 pt-8 pb-8 text-center relative overflow-hidden rounded-t-3xl">
                    {/* ✅ BOTÓN VOLVER */}
                    <button
                      type="button"
                      onClick={handleBackFromCompleteProfile}
                      className="absolute left-6 top-6 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:scale-110"
                      aria-label="Volver"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.15,
                        type: "spring",
                        stiffness: 200,
                      }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4"
                    >
                      <UserIcon className="w-8 h-8 text-white" />
                    </motion.div>

                    <h2 className="text-white font-bold text-2xl">
                      Completá tu Perfil
                    </h2>
                    <p className="text-white/90">Paso 2 de 2</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
                    {pendingFullName && (
                      <div className="bg-[#FFF4E6] border-l-4 border-[#FF6B00] p-4 rounded-r-2xl mb-5">
                        <p className="text-[#1C2335] text-sm">
                          <span className="font-semibold">
                            ¡Bienvenido, {pendingFullName}!
                          </span>
                          <br />
                          Completá estos datos para finalizar tu registro.
                        </p>
                      </div>
                    )}

                    <form
                      onSubmit={handleCompleteProfile}
                      className="space-y-6"
                      onChange={() => setStep2Dirty(true)}
                    >
                      {/* TELÉFONO */}
                      <div>
                        <Label className="text-[#1C2335] mb-2 block font-semibold">
                          Teléfono
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: 8888-8888"
                            className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 ${
                              phoneError
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                            }`}
                          />
                        </div>
                        {phoneError && (
                          <p className="text-red-500 mt-2 text-sm font-medium">
                            {phoneError}
                          </p>
                        )}
                      </div>

                      {/* DNI */}
                      <div>
                        <Label className="text-[#1C2335] mb-2 block font-semibold">
                          Documento de identidad (DNI)
                        </Label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="text"
                            value={dni}
                            onChange={(e) => setDni(e.target.value)}
                            placeholder="Número de identificación"
                            className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 ${
                              dniError
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                            }`}
                          />
                        </div>
                        {dniError && (
                          <p className="text-red-500 mt-2 text-sm font-medium">
                            {dniError}
                          </p>
                        )}
                      </div>

                      {/* FECHA NACIMIENTO */}
                      <div>
                        <Label className="text-[#1C2335] mb-2 block font-semibold">
                          Fecha de nacimiento
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 ${
                              birthDateError
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                            }`}
                          />
                        </div>
                        {birthDateError && (
                          <p className="text-red-500 mt-2 text-sm font-medium">
                            {birthDateError}
                          </p>
                        )}
                      </div>

                      {/* APARTAMENTO */}
                      <div>
                        <Label className="text-[#1C2335] mb-2 block font-semibold">
                          Número de apartamento (opcional)
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="text"
                            value={apartmentNumber}
                            onChange={(e) => setApartmentNumber(e.target.value)}
                            placeholder="Ej: A-302"
                            className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                          />
                        </div>
                      </div>

                      {/* PICKUP POINT */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF6B00]" />
                        Punto de retiro asignado:{" "}
                        <span className="font-semibold text-[#1C2335]">
                          {pickupPoint}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
                      >
                        {loading ? (
                          "Guardando..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Finalizar registro
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}

              {/* CONFIRM LEAVE MODAL */}
              <AnimatePresence>
                {showConfirmLeave && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 text-center"
                    >
                      <h3 className="text-lg font-bold text-[#1C2335] mb-2">
                        ¿Salir sin guardar?
                      </h3>
                      <p className="text-gray-600 text-sm mb-6">
                        Perderás los datos ingresados en tu perfil.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full"
                          onClick={() => setShowConfirmLeave(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="flex-1 rounded-full bg-[#FF6B00] text-white"
                          onClick={() => {
                            setShowConfirmLeave(false);
                            setStep2Dirty(false);
                            onClose();
                          }}
                        >
                          Salir
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
