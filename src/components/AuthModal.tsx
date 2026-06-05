// src/components/AuthModal.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  CreditCard,
  Calendar,
  MapPin,
  ChevronRight,
  Check,
  Clock,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../hooks/useStoreSettings";
import {
  isoToDisplay as _isoToDisplay,
  displayToIso,
  maskDateInput,
  isValidDisplayDate,
  validateAge16,
} from "../lib/dateUtils";

type SignUpStep = "form" | "creating" | "verifyEmail" | "completeProfile";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData?: any) => void;
  defaultMode?: "login" | "signup";
}

const PENDING_EMAIL_KEY = "heypoint_pending_email";
const PENDING_NAME_KEY = "heypoint_pending_name";
const RESEND_COOLDOWN_SECONDS = 60;
const TOO_MANY_REQUESTS_MESSAGE =
  "Hiciste demasiados intentos. Esperá unos minutos antes de volver a intentarlo.";
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


function normalizeDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

const SUGGESTED_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];

function getEmailSuggestions(value: string): string[] {
  if (!value || value.length < 2) return [];

  const atIdx = value.indexOf("@");

  if (atIdx === -1) {
    // No "@" yet — suggest all domains
    return SUGGESTED_DOMAINS.map((d) => `${value}@${d}`);
  }

  const local = value.slice(0, atIdx);
  if (!local) return [];

  const domainTyped = value.slice(atIdx + 1).toLowerCase();

  // Already has a complete domain (e.g. foo@gmail.com) — no suggestions
  if (/^[^.]+\.[a-z]{2,}$/.test(domainTyped)) return [];

  // Filter to domains starting with what's typed after @
  return SUGGESTED_DOMAINS.filter((d) => d.startsWith(domainTyped)).map(
    (d) => `${local}@${d}`,
  );
}

// Maps Firebase Auth error codes to friendly Spanish messages.
// Never expose raw Firebase error strings to the user.
const FIREBASE_ERROR_MAP: Record<string, string> = {
  "auth/invalid-credential":
    "El correo o la contraseña no son correctos.",
  "auth/wrong-password":
    "El correo o la contraseña no son correctos.",
  "auth/user-not-found":
    "El correo o la contraseña no son correctos.",
  "auth/email-already-in-use":
    "Ya existe una cuenta con este correo. Iniciá sesión.",
  "auth/account-exists-with-different-credential":
    "Ya existe una cuenta registrada con este correo. Iniciá sesión con el método que usaste originalmente.",
  "auth/too-many-requests": TOO_MANY_REQUESTS_MESSAGE,
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/network-request-failed":
    "Error de red. Revisá tu conexión e intentá de nuevo.",
  "auth/user-disabled":
    "Esta cuenta fue deshabilitada. Contactá soporte.",
};

function getFriendlyAuthError(error: any, fallback: string): string {
  // 1. Check direct .code property (Firebase SDK errors)
  const code = error?.code as string | undefined;
  if (code && code in FIREBASE_ERROR_MAP) {
    return FIREBASE_ERROR_MAP[code] || fallback;
  }

  // 2. Check if any known code appears inside the message string
  //    (Firebase sometimes embeds the code in the message)
  const raw = String(error?.message || "");
  for (const [key, msg] of Object.entries(FIREBASE_ERROR_MAP)) {
    if (raw.includes(key)) return msg || fallback;
  }

  // 3. If the message is already a friendly custom message (e.g. from
  //    our own backend/bootstrap), return it as-is.
  //    Heuristic: if it doesn't start with "Firebase:" it's ours.
  if (raw && !raw.startsWith("Firebase:")) return raw;

  return fallback;
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
    user: sessionUser,
    loginWithEmail,
    signupWithEmail,
    startGoogleOAuth,
    sendResetPassword,
    refreshEmailVerification,
    sendVerifyEmailPro, // ✅ ESTA ES LA CLAVE
    getAuthToken,
    getIdToken,
  } = useAuth();
  const { settings: storeSettings } = useStoreSettings();

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
  const [verificationCountdown, setVerificationCountdown] = useState(
    RESEND_COOLDOWN_SECONDS,
  );
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");

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
  const [apartmentNumberError, setApartmentNumberError] = useState("");

  // Legal consent — signup form (step 1)
  const [signUpTermsAccepted, setSignUpTermsAccepted] = useState(false);
  const [signUpTermsError, setSignUpTermsError] = useState("");

  // Legal consent — complete profile form (step 3, both email and Google new users)
  const [profileTermsAccepted, setProfileTermsAccepted] = useState(false);
  const [profileTermsError, setProfileTermsError] = useState("");

  const shouldReduceMotion = useReducedMotion();

  // Email suggestion visibility
  const [showLoginSuggestions, setShowLoginSuggestions] = useState(false);
  const [showSignupSuggestions, setShowSignupSuggestions] = useState(false);

  const pickupPoint =
    storeSettings?.pickupPoint?.address ||
    storeSettings?.pickupPoint?.name ||
    "Vilanova Haedo";

  // ✅ FIX: token retry (Google puede tardar en estar listo)
  async function getIdTokenWithRetry(retries = 6, delayMs = 250) {
    let lastErr: any = null;

    for (let i = 0; i < retries; i++) {
      try {
        const tok = (await getAuthToken(true)) || (await getIdToken());
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
    setVerificationNotice("");

    const savedEmail = localStorage.getItem(PENDING_EMAIL_KEY);
    const savedName = localStorage.getItem(PENDING_NAME_KEY);
    const pendingProfile = localStorage.getItem(PENDING_PROFILE_KEY) === "1";

    setPhone("");
    setDni("");
    setBirthDate("");
    setApartmentNumber("");
    setApartmentNumberError("");

    // ✅ si Google ya autenticó y el padre cerró el modal, volvemos a Paso 2 automáticamente
    if (pendingProfile && sessionUser?.emailVerified !== false) {
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
      setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
      setIsResendEnabled(false);
      setVerificationNotice(
        "Te enviamos un correo de verificación. Revisá tu bandeja de entrada o spam.",
      );
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
    // Email verification is a hard blocking step — cannot be dismissed.
    if (signUpStep === "verifyEmail") return;
    if (signUpStep === "creating") return;
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

  const handleGoogle = async () => {
    try {
      setGlobalError("");
      setLoading(true);

      const { user, isNewUser } = await startGoogleOAuth();

      if (!user?.email)
        throw new Error("No se pudo obtener el email de Google.");

      // Guardamos básicos para el flujo (por si se cierra el modal)
      localStorage.setItem(PENDING_EMAIL_KEY, user.email);
      localStorage.setItem(PENDING_NAME_KEY, user.fullName || "");

      setActiveTab("signup");
      setPendingEmail(user.email);
      setPendingFullName(user.fullName || "");

      // ✅ REFRESH REAL de verificación desde Firebase (por si el context estaba stale)
      const verifiedNow = await refreshEmailVerification().catch(() => {
        // si falla el reload, usamos lo que venía del user
        return !!user.emailVerified;
      });

      // ✅ Si NO está verificado (caso raro en Google), entramos a verifyEmail y enviamos correo
      if (false && !verifiedNow) {
        // Reenvío vía Firebase (tu función del context)
        // Nota: sendVerifyEmailPro usa sendEmailVerification(auth.currentUser)
        await sendVerifyEmailPro().catch(() => {});
        setSignUpStep("verifyEmail");
        setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
        setIsResendEnabled(false);
        return;
      }

      // ✅ Si ES nuevo y ya está verificado: completar perfil
      if (isNewUser) {
        localStorage.setItem(PENDING_PROFILE_KEY, "1");
        setSignUpStep("completeProfile");
        setStep2Dirty(false);
        return;
      }

      // ✅ Si NO es nuevo: login normal y cerrar
      onLoginSuccess(user);
      onClose();
    } catch (e: any) {
      console.error("[handleGoogle]", e?.code, e?.message);
      setGlobalError(
        getFriendlyAuthError(e, "No se pudo iniciar con Google."),
      );
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

      // ✅ BLOQUEO: si no verificó, lo mandamos a verifyEmail
      if ((u as any)?.email && (u as any)?.emailVerified === false) {
        localStorage.setItem(PENDING_EMAIL_KEY, (u as any).email);
        localStorage.setItem(PENDING_NAME_KEY, (u as any).fullName || "");

        setActiveTab("signup");
        setPendingEmail((u as any).email);
        setPendingFullName((u as any).fullName || "");

        setSignUpStep("verifyEmail");
        setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
        setIsResendEnabled(false);
        setVerificationNotice(
          "Te enviamos un correo de verificación. Revisá tu bandeja de entrada o spam.",
        );
        setGlobalError(
          "Tu cuenta aún no está verificada. Revisá tu correo y Spam.",
        );
        return;
      }

      onLoginSuccess(u);
      onClose();
    } catch (e: any) {
      console.error("[handleLogin]", e?.code, e?.message);
      setGlobalError(
        getFriendlyAuthError(e, "No se pudo iniciar sesión. Revisá tus credenciales."),
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

    if (!signUpTermsAccepted) {
      setSignUpTermsError(
        "Debés aceptar los Términos y Condiciones para continuar.",
      );
      return;
    }

    try {
      setLoading(true);
      // Show intermediate loading screen immediately — hides the empty form flash.
      setSignUpStep("creating");

      // ✅ crea usuario + envía verificación (lo hace AuthContext)
      const user = await signupWithEmail(
        signUpFullName,
        signUpEmail,
        signUpPassword,
      );

      localStorage.setItem(PENDING_EMAIL_KEY, user.email);
      localStorage.setItem(PENDING_NAME_KEY, signUpFullName);
      localStorage.setItem(PENDING_PROFILE_KEY, "1");

      setPendingEmail(user.email);
      setPendingFullName(signUpFullName);

      setSignUpStep("verifyEmail");
      setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
      setIsResendEnabled(false);
      setVerificationNotice(
        user.verificationEmailSent
          ? "Te enviamos un correo de verificación. Revisá tu bandeja de entrada o spam."
          : user.verificationEmailError ||
              "La cuenta fue creada, pero no pudimos enviar el correo de verificación. Probá reenviarlo en unos minutos.",
      );
    } catch (e: any) {
      // Roll back to form so the user can correct and retry.
      setSignUpStep("form");
      setGlobalError(getFriendlyAuthError(e, "No se pudo crear la cuenta."));
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

      const pendingProfile = localStorage.getItem(PENDING_PROFILE_KEY) === "1";

      if (pendingProfile) {
        setSignUpStep("completeProfile");
        setStep2Dirty(false);
        return;
      }

      // Si no hay perfil pendiente, es un usuario existente: lo dejamos loguear
      onLoginSuccess({
        email: pendingEmail,
        fullName: pendingFullName || "User",
      });
      onClose();
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

      await sendVerifyEmailPro();

      setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
      setIsResendEnabled(false);
      setVerificationNotice(
        "Te enviamos un correo de verificación. Revisá tu bandeja de entrada o spam.",
      );

      openGmail();
    } catch (e: any) {
      setVerificationCountdown(RESEND_COOLDOWN_SECONDS);
      setIsResendEnabled(false);
      setGlobalError(getFriendlyAuthError(e, "No se pudo reenviar."));
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
    setApartmentNumberError("");
    setGlobalError("");

    let hasError = false;

    const phoneDigits = normalizeDigits(phone);
    if (!phoneDigits || phoneDigits.length < 8) {
      setPhoneError("Ingresá un teléfono válido (mínimo 8 dígitos)");
      hasError = true;
    }

    const dniTrim = (dni || "").trim();
    if (!dniTrim || dniTrim.length < 7 || dniTrim.length > 15) {
      setDniError("El DNI debe tener entre 7 y 15 dígitos");
      hasError = true;
    }

    if (!birthDate) {
      setBirthDateError("La fecha de nacimiento es requerida");
      hasError = true;
    } else if (!isValidDisplayDate(birthDate)) {
      setBirthDateError("Fecha inválida. Usá el formato dd/mm/aaaa");
      hasError = true;
    } else if (!validateAge16(displayToIso(birthDate))) {
      setBirthDateError("Debés tener al menos 16 años");
      hasError = true;
    }

    const uf = normalizeDigits(apartmentNumber).slice(0, 3);
    if (!uf || !/^\d{1,3}$/.test(uf)) {
      setApartmentNumberError("Ingresá un número válido (máx. 3 dígitos)");
      hasError = true;
    }

    // Only require consent in this step if the user did NOT already accept
    // during email/password signup (signUpTermsAccepted covers that case).
    if (!signUpTermsAccepted && !profileTermsAccepted) {
      setProfileTermsError(
        "Debés aceptar los Términos y Condiciones para continuar.",
      );
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const consentAt = new Date().toISOString();
      const finalUser = {
        email: pendingEmail,
        fullName: pendingFullName || "User",
        phone: phoneDigits,
        dni: dniTrim,
        birthDate: displayToIso(birthDate),
        apartmentNumber: uf,
        pickupPoint,
        termsAccepted: true,
        termsAcceptedAt: consentAt,
        privacyAccepted: true,
        privacyAcceptedAt: consentAt,
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
    setApartmentNumberError("");
    setProfileTermsAccepted(false);
    setProfileTermsError("");
    setStep2Dirty(false);

    setPhone("");
    setDni("");
    setBirthDate("");
    setApartmentNumber("");
    setApartmentNumberError("");

    setSignUpStep("form");
    setActiveTab("signup");
  };

  // =========================
  // Derived UI values
  // =========================

  // Inline suggestion lists (computed per render — no memoization needed for this simple case)
  const loginSuggestions = showLoginSuggestions ? getEmailSuggestions(loginEmail) : [];
  const signupSuggestions = showSignupSuggestions ? getEmailSuggestions(signUpEmail) : [];

  // Button readiness — drives disabled state + visual style
  const loginFormReady = !!loginEmail.trim() && !!loginPassword.trim();
  const signupFormReady =
    !!signUpFullName.trim() &&
    !!signUpEmail.trim() &&
    strengthInfo.strength !== "weak" &&
    signUpTermsAccepted;

  // =========================
  // UI (la tuya, igual)
  // =========================
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[8px] z-[9000]"
            onMouseDown={onBackdropMouseDown}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-x-hidden overflow-y-auto overscroll-contain pointer-events-none">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: "easeOut" }}
              className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col my-auto min-h-0"
              style={{ height: "min(88vh, 900px)" }} // 🔥 CAMBIO: height fijo en vez de maxHeight
            >
              {signUpStep !== "verifyEmail" && signUpStep !== "creating" && (
                <button
                  onClick={guardedClose}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2E2E2E] flex items-center justify-center transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* STEP 1: FORM */}
              {signUpStep === "form" && !showForgotPassword && (
                <>
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <h2 className="font-bold text-2xl">
                      ¡Bienvenido a Hey!Point
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
                          className="w-full mb-6 py-6 rounded-2xl border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] transition-colors group"
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
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                              <Input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => {
                                  setLoginEmail(e.target.value);
                                  setShowLoginSuggestions(true);
                                }}
                                onFocus={() => setShowLoginSuggestions(true)}
                                onBlur={() =>
                                  setTimeout(
                                    () => setShowLoginSuggestions(false),
                                    150,
                                  )
                                }
                                placeholder="tu.email@ejemplo.com"
                                className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                                required
                              />
                            </div>
                            {loginSuggestions.length > 0 && (
                              <div className="mt-1 rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
                                {loginSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setLoginEmail(s);
                                      setShowLoginSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FFF4E6] transition-colors"
                                  >
                                    <span className="text-gray-500">
                                      {s.split("@")[0]}
                                    </span>
                                    <span className="font-semibold text-[#FF6B00]">
                                      @{s.split("@")[1]}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
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

                          {/* Contextual error — login */}
                          {!!globalError && (
                            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-red-700 font-medium leading-snug">{globalError}</p>
                            </div>
                          )}

                          <Button
                            type="submit"
                            disabled={loading || !loginFormReady}
                            className={`w-full py-6 rounded-2xl transition-all ${
                              loginFormReady && !loading
                                ? "bg-[#FF6B00] hover:bg-[#e56000] text-white shadow-lg"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            }`}
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
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                              <Input
                                type="email"
                                value={signUpEmail}
                                onChange={(e) => {
                                  setSignUpEmail(e.target.value);
                                  setEmailError("");
                                  setShowSignupSuggestions(true);
                                }}
                                onFocus={() => setShowSignupSuggestions(true)}
                                onBlur={() =>
                                  setTimeout(
                                    () => setShowSignupSuggestions(false),
                                    150,
                                  )
                                }
                                placeholder="tu.email@ejemplo.com"
                                className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-colors ${
                                  emailError
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                }`}
                                required
                              />
                            </div>
                            {signupSuggestions.length > 0 && (
                              <div className="mt-1 rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
                                {signupSuggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setSignUpEmail(s);
                                      setShowSignupSuggestions(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FFF4E6] transition-colors"
                                  >
                                    <span className="text-gray-500">
                                      {s.split("@")[0]}
                                    </span>
                                    <span className="font-semibold text-[#FF6B00]">
                                      @{s.split("@")[1]}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
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
                                className={`pl-12 pr-12 py-6 rounded-2xl border-2 focus:ring-2 transition-colors ${
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
                                  <div
                                    style={{ width: `${strengthInfo.score}%` }}
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

                          {/* Legal consent */}
                          <div className="space-y-2.5">
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Te invitamos a conocer nuestras{" "}
                              <a
                                href="/privacidad"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Políticas de Privacidad
                              </a>{" "}
                              y los{" "}
                              <a
                                href="/terminos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Términos y Condiciones
                              </a>
                              .
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={signUpTermsAccepted}
                                onChange={(e) => {
                                  setSignUpTermsAccepted(e.target.checked);
                                  if (e.target.checked) setSignUpTermsError("");
                                }}
                                className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-gray-300 accent-[#FF6B00]"
                              />
                              <span className="text-sm text-gray-600 leading-relaxed">
                                He leído y acepto los{" "}
                                <a
                                  href="/terminos"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF6B00] hover:underline font-medium"
                                >
                                  Términos y Condiciones
                                </a>{" "}
                                y las{" "}
                                <a
                                  href="/privacidad"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF6B00] hover:underline font-medium"
                                >
                                  Políticas de Privacidad
                                </a>
                                .
                              </span>
                            </label>
                            {signUpTermsError && (
                              <p className="text-red-500 text-sm flex items-center gap-1">
                                <span className="text-red-500">•</span>{" "}
                                {signUpTermsError}
                              </p>
                            )}
                          </div>

                          {/* Contextual error — signup */}
                          {!!globalError && (
                            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-red-700 font-medium leading-snug">{globalError}</p>
                            </div>
                          )}

                          <Button
                            type="submit"
                            disabled={loading || !signupFormReady}
                            className={`w-full py-6 rounded-2xl transition-all ${
                              signupFormReady && !loading
                                ? "bg-[#FF6B00] hover:bg-[#e56000] text-white shadow-lg"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            }`}
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
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-colors ${
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

              {/* CREATING ACCOUNT — intermediate loading screen */}
              {signUpStep === "creating" && (
                <div className="flex flex-col items-center justify-center h-full px-8 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFF4E6] flex items-center justify-center mb-6">
                    <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin" />
                  </div>
                  <h2
                    className="text-[#1C2335] font-bold"
                    style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)" }}
                  >
                    Estamos creando tu cuenta…
                  </h2>
                  <p className="mt-3 text-gray-500 text-sm leading-relaxed">
                    Esto puede tardar unos segundos.
                  </p>
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
                    {verificationNotice && (
                      <p className="mt-2 text-sm text-[#FFF4E6]">
                        {verificationNotice}
                      </p>
                    )}
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
                            {/* Contextual error — verifyEmail */}
                            {!!globalError && (
                              <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-700 font-medium leading-snug">{globalError}</p>
                              </div>
                            )}

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
                <div className="flex flex-col h-full min-h-0 min-w-0 overflow-x-hidden">
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4 min-w-0">
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
                    <p className="mt-2 text-[#FFF4E6] break-words">
                      Esto nos ayuda a validar tu acceso y preparar tu pickup.
                    </p>
                  </div>

                  {/* ✅ FIX SCROLL REAL */}
                  <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                    <div
                      className="h-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain px-6 md:px-8 py-8"
                      style={{ WebkitOverflowScrolling: "touch" as any }}
                    >
                      <form
                        onSubmit={handleCompleteProfile}
                        className="space-y-6 min-w-0"
                      >
                        {/* Email / Nombre (solo display) */}
                        <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-4">
                          <div className="text-sm text-gray-600">Cuenta</div>
                          <div className="mt-1 font-semibold text-[#1C2335] break-words">
                            {pendingFullName || "User"}
                          </div>
                          <div className="text-sm text-gray-600 break-all">
                            {pendingEmail}
                          </div>
                        </div>

                        {/* Teléfono */}
                        <div>
                          <Label className="text-[#1C2335] mb-2 block font-semibold">
                            Teléfono
                          </Label>
                          <div className={`relative min-w-0 flex items-center rounded-2xl border-2 transition-colors overflow-hidden ${
                            phoneError
                              ? "border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
                              : "border-gray-200 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/20"
                          }`}>
                            <span className="flex-shrink-0 pl-4 pr-3 text-sm font-semibold text-gray-500 select-none pointer-events-none border-r border-gray-200 py-[22px] bg-gray-50">
                              +54
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={phone}
                              onChange={(e) => {
                                setPhone(normalizeDigits(e.target.value));
                                setPhoneError("");
                                setStep2Dirty(true);
                              }}
                              placeholder="11 2345 6789"
                              className="flex-1 pl-3 pr-4 py-[22px] text-base bg-transparent outline-none text-[#1C2335] placeholder:text-gray-400"
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
                            DNI / N° de documento
                          </Label>
                          <div className="relative min-w-0">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              value={dni}
                              onChange={(e) => {
                                setDni(normalizeDigits(e.target.value));
                                setDniError("");
                                setStep2Dirty(true);
                              }}
                              placeholder="Ej: 12345678"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-2 transition-colors ${
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
                          <div className="relative min-w-0">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400 pointer-events-none">
                              <Calendar className="w-5 h-5" />
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={birthDate}
                              placeholder="dd/mm/aaaa"
                              maxLength={10}
                              onChange={(e) => {
                                setBirthDate(maskDateInput(e.target.value));
                                setBirthDateError("");
                                setStep2Dirty(true);
                              }}
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-4 transition-all ${
                                birthDateError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
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
                            UF
                          </Label>
                          <div className="relative min-w-0">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              value={apartmentNumber}
                              onChange={(e) => {
                                setApartmentNumber(
                                  normalizeDigits(e.target.value).slice(0, 3),
                                );
                                setApartmentNumberError("");
                                setStep2Dirty(true);
                              }}
                              placeholder="Ej: 101"
                              inputMode="numeric"
                              maxLength={3}
                              pattern="[0-9]*"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 focus:ring-4 transition-all ${
                                apartmentNumberError
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                  : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                              }`}
                            />
                          </div>
                          {apartmentNumberError && (
                            <p className="text-red-500 mt-2 text-sm font-semibold">
                              {apartmentNumberError}
                            </p>
                          )}
                        </div>

                        {/* Pickup point */}
                        <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            Punto de retiro
                          </div>
                          <div className="mt-1 font-semibold text-[#1C2335] break-words">
                            {pickupPoint}
                          </div>
                        </div>

                        {/* Legal consent — only shown for Google new users.
                            Email/password users already accepted in step 1. */}
                        {!signUpTermsAccepted && (
                          <div className="space-y-2.5">
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Te invitamos a conocer nuestras{" "}
                              <a
                                href="/privacidad"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Políticas de Privacidad
                              </a>{" "}
                              y los{" "}
                              <a
                                href="/terminos"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Términos y Condiciones
                              </a>
                              .
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={profileTermsAccepted}
                                onChange={(e) => {
                                  setProfileTermsAccepted(e.target.checked);
                                  if (e.target.checked) setProfileTermsError("");
                                }}
                                className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-gray-300 accent-[#FF6B00]"
                              />
                              <span className="text-sm text-gray-600 leading-relaxed">
                                He leído y acepto los{" "}
                                <a
                                  href="/terminos"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF6B00] hover:underline font-medium"
                                >
                                  Términos y Condiciones
                                </a>{" "}
                                y las{" "}
                                <a
                                  href="/privacidad"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#FF6B00] hover:underline font-medium"
                                >
                                  Políticas de Privacidad
                                </a>
                                .
                              </span>
                            </label>
                            {profileTermsError && (
                              <p className="text-red-500 text-sm flex items-center gap-1">
                                <span className="text-red-500">•</span>{" "}
                                {profileTermsError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Contextual error — completeProfile */}
                        {!!globalError && (
                          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700 font-medium leading-snug">{globalError}</p>
                          </div>
                        )}

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


