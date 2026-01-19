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

/**
 * ✅ FIX #1: normalizar base para que SIEMPRE termine en /api
 * ✅ FIX #2: joinUrl robusto (evita dobles slashes)
 */
function joinUrl(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = (path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

function resolveApiBase() {
  const raw =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000"; // ✅ SIN /api aquí

  const base = String(raw).trim().replace(/\/+$/, "");
  if (base.endsWith("/api")) return base;
  return `${base}/api`;
}

async function saveProfileToBackend(payload: any, idToken: string) {
  const apiBase = resolveApiBase();
  const url = joinUrl(apiBase, "/customers/profile");

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

  // ✅ FIX: token retry (Google puede tardar en estar listo)
  async function getIdTokenWithRetry(retries = 6, delayMs = 250) {
    let lastErr: any = null;

    for (let i = 0; i < retries; i++) {
      try {
        const tok = await getIdToken();
        if (tok) return tok;
      } catch (e) {
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }

    throw new Error(
      lastErr?.message ||
        "No se pudo obtener el token de sesión. Probá de nuevo.",
    );
  }

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

      // ✅ FIX: token con retry (evita fallos random con Google)
      const idToken = await getIdTokenWithRetry();
      await saveProfileToBackend(finalUser, idToken);

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
    setGlobalError("");
    setPhoneError("");
    setDniError("");
    setBirthDateError("");
    setStep2Dirty(false);

    setPhone("");
    setDni("");
    setBirthDate("");
    setApartmentNumber("");

    setSignUpStep("form");
    setActiveTab("signup");
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
              className="relative w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col my-auto min-h-0"
              style={{ height: "min(88vh, 900px)" }} // 🔥 CAMBIO: height fijo en vez de maxHeight
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

              {/* FORGOT PASSWORD */}
              {signUpStep === "form" && showForgotPassword && (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <button
                      type="button"
                      onClick={backToLogin}
                      className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver
                    </button>

                    <h2 className="font-bold text-2xl mt-3">
                      Recuperar acceso
                    </h2>
                    <p className="mt-2 text-[#FFF4E6]">
                      Te enviaremos un link para restablecer tu contraseña.
                    </p>
                  </div>

                  {/* ✅ FIX SCROLL */}
                  <div
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 md:px-8 py-8"
                    style={{ WebkitOverflowScrolling: "touch" as any }}
                  >
                    {!forgotPasswordSent ? (
                      <form onSubmit={handleForgot} className="space-y-6">
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            Correo electrónico
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) =>
                                setForgotPasswordEmail(e.target.value)
                              }
                              placeholder="tu.email@ejemplo.com"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                forgotPasswordError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                              }`}
                              required
                            />
                          </div>

                          {forgotPasswordError && (
                            <p className="text-red-500 mt-2 text-sm font-semibold">
                              {forgotPasswordError}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg"
                          style={{ fontWeight: 600 }}
                        >
                          {loading
                            ? "Enviando..."
                            : "Enviar link de recuperación"}
                        </Button>

                        <p className="text-center text-gray-500 text-sm">
                          ¿Ya recordaste tu contraseña?{" "}
                          <button
                            type="button"
                            onClick={backToLogin}
                            className="text-[#FF6B00] hover:text-[#e56000] font-semibold"
                          >
                            Volver a iniciar sesión
                          </button>
                        </p>
                      </form>
                    ) : (
                      <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-[#1C2335]">
                              ¡Listo! Revisá tu correo
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Enviamos un enlace de recuperación a{" "}
                              <span className="font-semibold">
                                {forgotPasswordEmail}
                              </span>
                              . Revisá también Spam/Promociones.
                            </p>

                            <div className="mt-4 flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={openGmail}
                                className="rounded-2xl border-2"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Abrir Gmail
                              </Button>

                              <Button
                                type="button"
                                onClick={backToLogin}
                                className="rounded-2xl bg-[#FF6B00] hover:bg-[#e56000]"
                              >
                                Volver
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VERIFY EMAIL */}
              {signUpStep === "verifyEmail" && (
                <div className="flex flex-col h-full">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <h2 className="font-bold text-2xl">Verificá tu email</h2>
                    <p className="mt-2 text-[#FFF4E6]">
                      Te enviamos un correo a{" "}
                      <span className="font-semibold">{pendingEmail}</span>.
                      Abrilo y confirmá tu cuenta para continuar.
                    </p>
                  </div>

                  {/* ✅ FIX SCROLL */}
                  <div
                    className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 md:px-8 py-8"
                    style={{ WebkitOverflowScrolling: "touch" as any }}
                  >
                    <div className="rounded-3xl border border-gray-200 bg-white p-5">
                      <div className="flex items-start gap-3">
                        <Mail className="w-6 h-6 text-[#FF6B00] mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-bold text-[#1C2335]">
                            Paso 1 de 2 completado
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Cuando termines la verificación, tocá el botón de
                            abajo para comprobar y seguir con tus datos de
                            perfil.
                          </p>

                          <div className="mt-5 flex flex-col gap-3">
                            <Button
                              type="button"
                              onClick={handleCheckVerified}
                              disabled={loading}
                              className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg"
                              style={{ fontWeight: 600 }}
                            >
                              {loading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-5 h-5 mr-2" />
                                  Ya verifiqué mi email
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={openGmail}
                              className="w-full py-6 rounded-2xl border-2"
                              style={{ fontWeight: 600 }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir Gmail
                            </Button>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {isResendEnabled ? (
                                  <span>Podés reenviar/abrir correo</span>
                                ) : (
                                  <span>
                                    Reintentar en{" "}
                                    <span className="font-semibold">
                                      {verificationCountdown}s
                                    </span>
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={handleResend}
                                disabled={!isResendEnabled || loading}
                                className={`text-sm font-semibold underline-offset-2 ${
                                  !isResendEnabled || loading
                                    ? "text-gray-400"
                                    : "text-[#FF6B00] hover:text-[#e56000] hover:underline"
                                }`}
                              >
                                Reenviar
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={handleChangeEmail}
                              className="text-sm font-semibold text-gray-600 hover:text-[#1C2335] underline-offset-2 hover:underline text-left"
                            >
                              Cambiar email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPLETE PROFILE (Paso 2) */}
              {signUpStep === "completeProfile" && (
                <div className="flex flex-col h-full min-h-0">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <button
                      type="button"
                      onClick={handleBackFromCompleteProfile}
                      className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver
                    </button>

                    <h2 className="font-bold text-2xl mt-3">
                      Completá tu perfil
                    </h2>
                    <p className="mt-2 text-[#FFF4E6]">
                      Esto nos ayuda a validar tu acceso y preparar tu pickup.
                    </p>
                  </div>

                  {/* ✅ FIX SCROLL REAL */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div
                      className="h-full overflow-y-auto overscroll-contain px-6 md:px-8 py-8"
                      style={{ WebkitOverflowScrolling: "touch" as any }}
                    >
                      <form
                        onSubmit={handleCompleteProfile}
                        className="space-y-6"
                      >
                        {/* Email / Nombre (solo display) */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-4">
                          <div className="text-sm text-gray-600">Cuenta</div>
                          <div className="mt-1 font-semibold text-[#1C2335]">
                            {pendingFullName || "User"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {pendingEmail}
                          </div>
                        </div>

                        {/* Teléfono */}
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            Teléfono
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                setPhoneError("");
                                setStep2Dirty(true);
                              }}
                              placeholder="Ej: 8888 8888"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                phoneError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                              }`}
                            />
                          </div>
                          {phoneError && (
                            <p className="text-red-500 mt-2 text-sm font-semibold">
                              {phoneError}
                            </p>
                          )}
                        </div>

                        {/* DNI */}
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            DNI / ID
                          </Label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              value={dni}
                              onChange={(e) => {
                                setDni(e.target.value);
                                setDniError("");
                                setStep2Dirty(true);
                              }}
                              placeholder="Ej: 1-2345-6789"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                dniError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                              }`}
                            />
                          </div>
                          {dniError && (
                            <p className="text-red-500 mt-2 text-sm font-semibold">
                              {dniError}
                            </p>
                          )}
                        </div>

                        {/* Fecha de nacimiento */}
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            Fecha de nacimiento
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              type="date"
                              value={birthDate}
                              onChange={(e) => {
                                setBirthDate(e.target.value);
                                setBirthDateError("");
                                setStep2Dirty(true);
                              }}
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-all ${
                                birthDateError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                              }`}
                            />
                          </div>
                          {birthDateError && (
                            <p className="text-red-500 mt-2 text-sm font-semibold">
                              {birthDateError}
                            </p>
                          )}
                        </div>

                        {/* Apartamento */}
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            Número de apartamento (opcional)
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              value={apartmentNumber}
                              onChange={(e) => {
                                setApartmentNumber(e.target.value);
                                setStep2Dirty(true);
                              }}
                              placeholder="Ej: Torre A - 1204"
                              className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                            />
                          </div>
                        </div>

                        {/* Pickup point */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            Punto de retiro
                          </div>
                          <div className="mt-1 font-semibold text-[#1C2335]">
                            {pickupPoint}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg"
                          style={{ fontWeight: 600 }}
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              Continuar{" "}
                              <ChevronRight className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm leave step2 */}
              {showConfirmLeave && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-30 flex items-center justify-center p-4">
                  <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-200 p-5">
                    <h3 className="text-[#1C2335] font-bold text-lg">
                      ¿Salir sin guardar?
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Tenés datos sin guardar en tu perfil. Si salís ahora, se
                      perderán.
                    </p>

                    <div className="mt-5 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-2xl"
                        onClick={() => setShowConfirmLeave(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 rounded-2xl bg-[#FF6B00] hover:bg-[#e56000]"
                        onClick={() => {
                          setShowConfirmLeave(false);
                          onClose();
                        }}
                      >
                        Salir
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
