import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { ChangeEmailModal } from "../components/ChangeEmailModal";
import { useStoreSettings } from "../hooks/useStoreSettings";
import { API_URL } from "../lib/api";

import {
  User,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Home,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  isoToDisplay,
  displayToIso,
  maskDateInput,
  isValidDisplayDate,
  validateAge16,
} from "../lib/dateUtils";

type ApiProfile = {
  uid?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dni?: string;
  birthDate?: string;
  apartmentNumber?: string;
  pickupPoint?: string;
};

const RESEND_COOLDOWN_SECONDS = 60;
const TOO_MANY_REQUESTS_MESSAGE =
  "Hiciste demasiados intentos. Esperá unos minutos antes de volver a intentarlo.";

function getFriendlyAuthError(error: any, fallback: string) {
  const raw = String(error?.code || error?.message || "");
  if (raw.includes("too-many-requests")) return TOO_MANY_REQUESTS_MESSAGE;
  return error?.message || fallback;
}

interface UserProfilePageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

function normalizeDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export function UserProfilePage({
  onNavigate,
  isLoggedIn = true,
  onLogout,
}: UserProfilePageProps) {
  const {
    getAuthToken,
    currentUser,
    changePassword,
    refreshEmailVerification,
    sendVerifyEmailPro,
    isGoogleUser,
    hasPasswordProvider,
  } = useAuth();
  const { settings: storeSettings } = useStoreSettings();
  const globalPickupPoint =
    storeSettings?.pickupPoint?.address ||
    storeSettings?.pickupPoint?.name ||
    "Vilanova Haedo";

  function apiUrl(path: string) {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${API_URL}${clean}`;
  }

  // UI states
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string>("");

  // Profile
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    emailVerified: !!currentUser?.emailVerified,
    phone: "",
    birthDate: "",
    dni: "",
    pickupPoint: "Vilanova Haedo",
    apartmentNumber: "",
  });

  const [originalData, setOriginalData] = useState({ ...profileData });

  // Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change email modal
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const refreshVerifiedState = async () => {
    try {
      setCheckingEmail(true);
      const verified = await refreshEmailVerification();
      setProfileData((prev) => ({ ...prev, emailVerified: verified }));
      setOriginalData((prev) => ({ ...prev, emailVerified: verified }));
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    try {
      setPageError("");
      await sendVerifyEmailPro(); // reenvía verificación
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setPageError(
        getFriendlyAuthError(
          e,
          "No se pudo reenviar el correo de verificación.",
        ),
      );
    }
  };

  // Password requirements
  const passwordRequirements = useMemo(() => {
    const p = passwordData.newPassword || "";
    return {
      hasUppercase: /[A-Z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasMinLength: p.length >= 8,
      hasSpecialChar: /[^A-Za-z0-9]/.test(p),
    };
  }, [passwordData.newPassword]);

  // Detect modifications
  useEffect(() => {
    const dataChanged =
      JSON.stringify(profileData) !== JSON.stringify(originalData);

    const passwordChanged =
      passwordData.currentPassword !== "" ||
      passwordData.newPassword !== "" ||
      passwordData.confirmNewPassword !== "";

    setIsModified(dataChanged || passwordChanged);
  }, [profileData, passwordData, originalData]);

  // Load profile from backend on mount
  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setPageLoading(true);
      setPageError("");

      try {
        const idToken = await getAuthToken(true);
        if (!idToken) throw new Error("No hay sesión activa.");

        const url = apiUrl("/customers/me");

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `No se pudo cargar el perfil (${res.status}). ${txt}`.trim(),
          );
        }

        const data = (await res.json()) as {
          exists: boolean;
          profile: ApiProfile | null;
        };

        const api = data.profile || {};

        const verified = await refreshEmailVerification().catch(
          () => !!currentUser?.emailVerified,
        );

        const next = {
          fullName: api.fullName || currentUser?.displayName || "",
          email: currentUser?.email || api.email || "",
          emailVerified: verified,
          phone: api.phone || "",
          birthDate: isoToDisplay(api.birthDate || ""),
          dni: api.dni || "",
          pickupPoint: globalPickupPoint,
          apartmentNumber: api.apartmentNumber || "",
        };

        if (!mounted) return;
        setProfileData(next);
        setOriginalData(next);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[UserProfilePage] profile fetch failed", {
          apiUrl: apiUrl("/customers/me"),
          apiBase: API_URL,
          userUid: currentUser?.uid,
          userEmail: currentUser?.email,
          error: e,
        });
        setPageError(
          "No pudimos cargar tu perfil. Intentá nuevamente en unos segundos.",
        );
      } finally {
        if (!mounted) return;
        setPageLoading(false);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, [getAuthToken, currentUser, globalPickupPoint]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }

    // email (solo mostrar, pero igual validamos)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!emailRegex.test(profileData.email)) {
      newErrors.email = "Por favor ingresa un correo válido";
    }

    // Tel CR suele ser 8 dígitos; dejamos mínimo 8
    const phoneDigits = normalizeDigits(profileData.phone);
    if (!phoneDigits || phoneDigits.length < 8) {
      newErrors.phone = "El teléfono debe tener mínimo 8 dígitos";
    }

    if (!profileData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else if (!isValidDisplayDate(profileData.birthDate)) {
      newErrors.birthDate = "Fecha inválida. Usá el formato dd/mm/aaaa";
    } else if (!validateAge16(displayToIso(profileData.birthDate))) {
      newErrors.birthDate = "Debes tener al menos 16 años";
    }

    const dniTrim = (profileData.dni || "").trim();
    if (!dniTrim) {
      newErrors.dni = "El DNI es requerido";
    } else if (dniTrim.length < 7 || dniTrim.length > 15) {
      newErrors.dni = "El DNI debe tener entre 7 y 15 dígitos";
    }

    const uf = normalizeDigits(profileData.apartmentNumber || "").slice(0, 3);
    if (!uf || !/^\d{1,3}$/.test(uf)) {
      newErrors.apartmentNumber = "Ingresá un número de UF válido (máx. 3 dígitos)";
    }

    // Password validation if user wants to change it
    const wantsPasswordChange =
      passwordData.currentPassword ||
      passwordData.newPassword ||
      passwordData.confirmNewPassword;

    if (wantsPasswordChange) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Ingresa tu contraseña actual";
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = "Ingresa una nueva contraseña";
      } else if (!Object.values(passwordRequirements).every(Boolean)) {
        newErrors.newPassword =
          "La contraseña no cumple con todos los requisitos";
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        newErrors.confirmNewPassword = "Las contraseñas no coinciden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof profileData, value: any) => {
    const nextValue =
      field === "apartmentNumber"
        ? normalizeDigits(String(value)).slice(0, 3)
        : field === "phone" || field === "dni"
          ? normalizeDigits(String(value))
          : field === "birthDate"
            ? maskDateInput(String(value))
            : value;
    setProfileData((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field as string];
        return n;
      });
    }
  };

  const handlePasswordChange = (
    field: keyof typeof passwordData,
    value: string,
  ) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field as string];
        return n;
      });
    }
  };

  const handleSaveChanges = async () => {
    setSaveSuccess(false);
    setPageError("");

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const idToken = await getAuthToken(false);
      if (!idToken) throw new Error("No hay sesión activa.");

      // 1) Guardar perfil en backend
      const payload = {
        fullName: (profileData.fullName || "").trim(), // ✅ NUEVO
        phone: normalizeDigits(profileData.phone),
        dni: (profileData.dni || "").trim(),
        birthDate: displayToIso(profileData.birthDate),
        apartmentNumber: (profileData.apartmentNumber || "").trim(),
        pickupPoint: globalPickupPoint,
      };

      const res = await fetch(apiUrl("/customers/me"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `No se pudo guardar el perfil (${res.status}). ${txt}`.trim(),
        );
      }

      // 2) Cambiar contraseña si aplica
      const wantsPasswordChange =
        passwordData.currentPassword &&
        passwordData.newPassword &&
        passwordData.confirmNewPassword;

      if (wantsPasswordChange) {
        await changePassword(
          passwordData.currentPassword,
          passwordData.newPassword,
        );
      }

      setSaveSuccess(true);
      setOriginalData({ ...profileData });

      // reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setPageError(e?.message || "Error guardando cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setErrors({});
    setSaveSuccess(false);
  };

  const handleEmailChanged = async (newEmail: string) => {
    // Firebase has already verified and applied the new email at this point.
    // Mark it as verified immediately; do NOT send another verification email.
    setProfileData((prev) => ({
      ...prev,
      email: newEmail,
      emailVerified: true,
    }));
    setOriginalData((prev) => ({
      ...prev,
      email: newEmail,
      emailVerified: true,
    }));
    setShowChangeEmailModal(false);

    // Reload Firebase Auth state so token + currentUser reflect the new email
    await refreshVerifiedState();
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="profile"
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        userName={profileData.fullName || currentUser?.displayName || "Usuario"}
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-6 py-8 md:py-12 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8 md:mb-10">
              <h1
                className="text-[#1C2335] mb-3"
                style={{
                  fontSize: "clamp(2rem, 5vw, 2.5rem)",
                  fontWeight: 700,
                }}
              >
                Mi perfil
              </h1>
              <p
                className="text-[#2E2E2E]/70"
                style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}
              >
                Actualizá tu información personal y datos de retiro.
              </p>
            </div>

            {/* Top error */}
            {!!pageError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p
                  className="text-red-700"
                  style={{ fontSize: "0.938rem", fontWeight: 600 }}
                >
                  {pageError}
                </p>
              </div>
            )}

            <Card
              className="border-none shadow-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%)",
                borderRadius: "24px",
              }}
            >
              <div className="p-6 md:p-10">
                {/* Loading */}
                {pageLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                    <p className="text-[#2E2E2E]/70">Cargando perfil...</p>
                  </div>
                ) : (
                  <>
                    {/* Success */}
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p
                          className="text-green-700"
                          style={{ fontSize: "0.938rem", fontWeight: 600 }}
                        >
                          ¡Tu perfil se actualizó correctamente!
                        </p>
                      </motion.div>
                    )}

                    {/* Personal */}
                    <div className="mb-8">
                      <h2
                        className="text-[#1C2335] mb-6 pb-3 border-b border-gray-200"
                        style={{
                          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
                          fontWeight: 600,
                        }}
                      >
                        Información Personal
                      </h2>

                      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                        {/* Full Name */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Nombre completo{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                            <Input
                              value={profileData.fullName}
                              onChange={(e) =>
                                handleInputChange("fullName", e.target.value)
                              }
                              placeholder="Juan Pérez"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all text-[#1C2335]
                                ${
                                  errors.fullName
                                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                                }`}
                            />
                          </div>
                          {errors.fullName && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1.5"
                              style={{ fontSize: "0.813rem", fontWeight: 600 }}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.fullName}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Correo electrónico{" "}
                            <span className="text-red-500">*</span>
                          </Label>

                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              type="email"
                              value={profileData.email}
                              disabled
                              className="pl-12 pr-10 py-6 rounded-2xl border-2 border-gray-300 bg-gray-50 cursor-not-allowed opacity-80"
                            />

                            {profileData.emailVerified ? (
                              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[#2E2E2E]/60 text-xs">
                              {profileData.emailVerified
                                ? "Email verificado ✓"
                                : "Email NO verificado"}
                            </p>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={refreshVerifiedState}
                                className="text-[#2E2E2E]/70 hover:text-[#1C2335] transition-colors inline-flex items-center gap-1"
                                style={{
                                  fontSize: "0.813rem",
                                  fontWeight: 600,
                                }}
                                disabled={checkingEmail}
                                title="Revisar verificación"
                              >
                                <RefreshCw
                                  className={`w-3.5 h-3.5 ${checkingEmail ? "animate-spin" : ""}`}
                                />
                                {checkingEmail ? "Revisando..." : "Revisar"}
                              </button>

                              {!profileData.emailVerified && (
                                <button
                                  type="button"
                                  onClick={handleResendVerification}
                                  disabled={resendCooldown > 0}
                                  className={`transition-colors inline-flex items-center gap-1 ${
                                    resendCooldown > 0
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-[#FF6B00] hover:text-[#e56000]"
                                  }`}
                                  style={{
                                    fontSize: "0.813rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  {resendCooldown > 0
                                    ? `Reenviar en ${resendCooldown}s`
                                    : "Reenviar verificación"}
                                </button>
                              )}

                              {/* "Cambiar correo" — only for accounts with a password provider.
                                  Google-only accounts cannot change their email here; it is
                                  controlled by Google. Linked accounts (password + Google) keep
                                  the action available. */}
                              {hasPasswordProvider() ? (
                                <button
                                  type="button"
                                  onClick={() => setShowChangeEmailModal(true)}
                                  className="text-[#FF6B00] hover:text-[#e56000] transition-colors inline-flex items-center gap-1"
                                  style={{
                                    fontSize: "0.813rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Cambiar correo
                                </button>
                              ) : (
                                <span
                                  className="text-[#2E2E2E]/50 inline-flex items-center gap-1"
                                  style={{ fontSize: "0.813rem" }}
                                >
                                  Tu correo está gestionado por Google.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Teléfono <span className="text-red-500">*</span>
                          </Label>
                          <div className={`flex items-center rounded-2xl border-2 transition-all overflow-hidden ${
                            errors.phone
                              ? "border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20"
                              : "border-gray-300 focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/20"
                          }`}>
                            <span className="flex-shrink-0 pl-4 pr-3 text-sm font-semibold text-gray-500 select-none pointer-events-none border-r border-gray-200 py-[22px] bg-gray-50">
                              +54
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={profileData.phone}
                              onChange={(e) =>
                                handleInputChange("phone", e.target.value)
                              }
                              placeholder="11 2345 6789"
                              className="flex-1 pl-3 pr-4 py-[22px] text-base bg-transparent outline-none text-[#1C2335] placeholder:text-gray-400"
                            />
                          </div>
                          {errors.phone && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem", fontWeight: 600 }}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.phone}
                            </p>
                          )}
                        </div>

                        {/* Birth date */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Fecha de nacimiento{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-[#2E2E2E]/50 pointer-events-none">
                              <Calendar className="w-5 h-5" />
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={profileData.birthDate}
                              placeholder="dd/mm/aaaa"
                              maxLength={10}
                              onChange={(e) =>
                                handleInputChange("birthDate", e.target.value)
                              }
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.birthDate
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                } focus:ring-4`}
                            />
                          </div>
                          {errors.birthDate && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem" }}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {errors.birthDate}
                            </p>
                          )}
                        </div>

                        {/* DNI */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            DNI / N° de documento{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              value={profileData.dni}
                              onChange={(e) =>
                                handleInputChange("dni", e.target.value)
                              }
                              placeholder="Ej: 12345678"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.dni
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                } focus:ring-4`}
                            />
                          </div>
                          {errors.dni && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem", fontWeight: 600 }}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.dni}
                            </p>
                          )}
                        </div>

                        {/* Pickup */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            Point – Ubicación de retiro
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              value={profileData.pickupPoint}
                              disabled
                              className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-300 bg-gray-50 cursor-not-allowed opacity-70"
                            />
                          </div>
                          <p
                            className="mt-2 text-[#2E2E2E]/60"
                            style={{ fontSize: "0.813rem" }}
                          >
                            Este punto de retiro es administrado por HeyPoint!.
                            No podés editarlo desde acá.
                          </p>
                        </div>

                        {/* Apartment */}
                        <div>
                          <Label
                            className="text-[#1C2335] mb-2 block"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            UF <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              value={profileData.apartmentNumber}
                              onChange={(e) =>
                                handleInputChange(
                                  "apartmentNumber",
                                  e.target.value,
                                )
                              }
                              placeholder="Ej: 101"
                              inputMode="numeric"
                              maxLength={3}
                              pattern="[0-9]*"
                              className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.apartmentNumber
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 focus:ring-4"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 focus:ring-4"
                                }`}
                            />
                          </div>
                          {errors.apartmentNumber && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem" }}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {errors.apartmentNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Password section */}
                    {!hasPasswordProvider() && isGoogleUser() ? (
                      <div className="mb-8 p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <div>
                          <p className="text-blue-800 font-semibold" style={{ fontSize: "0.938rem" }}>
                            Iniciás sesión con Google
                          </p>
                          <p className="text-blue-700 mt-1" style={{ fontSize: "0.875rem" }}>
                            Tu cuenta no tiene contraseña. Para cambiarla, gestionala desde tu cuenta de Google.
                          </p>
                        </div>
                      </div>
                    ) : hasPasswordProvider() ? (
                    <div className="mb-8">
                      {isGoogleUser() && (
                        <p className="mb-4 text-sm text-blue-600">
                          También podés iniciar sesión con Google.
                        </p>
                      )}
                      <h2
                        className="text-[#1C2335] mb-6 pb-3 border-b border-gray-200"
                        style={{
                          fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
                          fontWeight: 600,
                        }}
                      >
                        Cambiar contraseña
                      </h2>

                      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                        {/* current */}
                        <div className="md:col-span-2">
                          <Label
                            className="text-[#2E2E2E] mb-2 block"
                            style={{ fontSize: "0.938rem", fontWeight: 500 }}
                          >
                            Contraseña actual
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "currentPassword",
                                  e.target.value,
                                )
                              }
                              placeholder="••••••••"
                              className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.currentPassword
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                } focus:ring-4`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword((s) => !s)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {errors.currentPassword && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem" }}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {errors.currentPassword}
                            </p>
                          )}
                        </div>

                        {/* new */}
                        <div>
                          <Label
                            className="text-[#2E2E2E] mb-2 block"
                            style={{ fontSize: "0.938rem", fontWeight: 500 }}
                          >
                            Nueva contraseña
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "newPassword",
                                  e.target.value,
                                )
                              }
                              placeholder="••••••••"
                              className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.newPassword
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                } focus:ring-4`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((s) => !s)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {errors.newPassword && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem" }}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {errors.newPassword}
                            </p>
                          )}
                        </div>

                        {/* confirm */}
                        <div>
                          <Label
                            className="text-[#2E2E2E] mb-2 block"
                            style={{ fontSize: "0.938rem", fontWeight: 500 }}
                          >
                            Confirmar nueva contraseña
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.confirmNewPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "confirmNewPassword",
                                  e.target.value,
                                )
                              }
                              placeholder="••••••••"
                              className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                                ${
                                  errors.confirmNewPassword
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                                } focus:ring-4`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((s) => !s)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {errors.confirmNewPassword && (
                            <p
                              className="mt-2 text-red-500 flex items-center gap-1"
                              style={{ fontSize: "0.813rem" }}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {errors.confirmNewPassword}
                            </p>
                          )}
                        </div>

                        {/* requirements */}
                        {passwordData.newPassword && (
                          <div className="md:col-span-2">
                            <div className="bg-[#FFF4E6] rounded-2xl p-4 space-y-2">
                              <p
                                className="text-[#2E2E2E] mb-3"
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                }}
                              >
                                La contraseña debe cumplir con:
                              </p>

                              {[
                                {
                                  ok: passwordRequirements.hasUppercase,
                                  text: "≥ 1 mayúscula (A-Z)",
                                },
                                {
                                  ok: passwordRequirements.hasNumber,
                                  text: "≥ 1 número (0-9)",
                                },
                                {
                                  ok: passwordRequirements.hasMinLength,
                                  text: "≥ 8 caracteres",
                                },
                                {
                                  ok: passwordRequirements.hasSpecialChar,
                                  text: "≥ 1 carácter especial (!@#$%^&*)",
                                },
                              ].map((r) => (
                                <div
                                  key={r.text}
                                  className="flex items-center gap-2"
                                >
                                  {r.ok ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span
                                    className={
                                      r.ok
                                        ? "text-green-700"
                                        : "text-[#2E2E2E]/60"
                                    }
                                    style={{ fontSize: "0.813rem" }}
                                  >
                                    {r.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={!isModified || isSaving}
                        className={`flex-1 sm:flex-none sm:ml-auto h-14 px-8 rounded-full transition-all shadow-lg
                          ${
                            !isModified || isSaving
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                              : "bg-gradient-to-r from-[#FF6B00] to-[#FF8534] hover:from-[#e56000] hover:to-[#FF6B00] text-white hover:shadow-xl transform hover:scale-105"
                          }`}
                        style={{ fontSize: "1rem", fontWeight: 800 }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Guardar cambios"
                        )}
                      </Button>

                      <Button
                        onClick={handleCancel}
                        disabled={!isModified || isSaving}
                        variant="ghost"
                        className="sm:flex-none h-14 px-8 text-[#2E2E2E] hover:text-[#FF6B00] hover:bg-[#FFF4E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontSize: "1rem", fontWeight: 700 }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />

      <ChangeEmailModal
        isOpen={showChangeEmailModal}
        onClose={() => setShowChangeEmailModal(false)}
        currentEmail={profileData.email}
        onEmailChanged={handleEmailChanged}
      />
    </div>
  );
}
