import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getAuth, verifyBeforeUpdateEmail, reload } from "firebase/auth";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onEmailChanged: (newEmail: string) => void;
}

type Step = "enterEmail" | "waitingVerification" | "success";

export function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onEmailChanged,
}: ChangeEmailModalProps) {
  const [step, setStep] = useState<Step>("enterEmail");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Resend email timer
  const [countdown, setCountdown] = useState(0);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  // Polling timeout — after ~4 min stop spinning and let user check manually
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  const [manualCheckFailed, setManualCheckFailed] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("enterEmail");
      setNewEmail("");
      setConfirmEmail("");
      setErrors({});
      setIsLoading(false);
      setCountdown(0);
      setIsResendEnabled(false);
      setPollingTimedOut(false);
      setManualCheckLoading(false);
      setManualCheckFailed(false);
    }
  }, [isOpen]);

  // Countdown timer for resend email
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && step === "waitingVerification") {
      setIsResendEnabled(true);
    }
  }, [countdown, step]);

  // Poll for email change confirmation (stops after ~4 min to avoid eternal spinner)
  useEffect(() => {
    if (step !== "waitingVerification") return;

    let cancelled = false;
    const auth = getAuth();
    // 4 minutes = 96 ticks × 2500ms
    let ticks = 0;
    const MAX_TICKS = 96;

    const checkEmailChanged = async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        await reload(u);
        const current = (auth.currentUser?.email || "").toLowerCase();
        const target = (newEmail || "").toLowerCase();
        if (current && target && current === target) {
          if (cancelled) return;
          setStep("success");
          setTimeout(() => {
            if (cancelled) return;
            onEmailChanged(newEmail);
            toast.success("¡Correo electrónico actualizado!", {
              description: "Tu correo electrónico fue actualizado exitosamente",
              duration: 3000,
            });
            onClose();
          }, 1200);
          return true; // signal: done
        }
      } catch {
        // reload failed — don't break the flow, keep trying
      }
      return false;
    };

    const tick = async () => {
      const done = await checkEmailChanged();
      if (done || cancelled) return;
      ticks += 1;
      if (ticks >= MAX_TICKS) {
        if (!cancelled) setPollingTimedOut(true);
      }
    };

    // First check immediately, then every 2.5 s
    tick();
    const interval = setInterval(tick, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, newEmail, onEmailChanged, onClose]);

  // Manual "Ya verifiqué" handler — one-shot reload check
  const handleManualCheck = async () => {
    setManualCheckLoading(true);
    setManualCheckFailed(false);
    const auth = getAuth();
    try {
      const u = auth.currentUser;
      if (u) await reload(u);
      const current = (auth.currentUser?.email || "").toLowerCase();
      const target = (newEmail || "").toLowerCase();
      if (current && target && current === target) {
        setStep("success");
        setTimeout(() => {
          onEmailChanged(newEmail);
          toast.success("¡Correo electrónico actualizado!", {
            description: "Tu correo electrónico fue actualizado exitosamente",
            duration: 3000,
          });
          onClose();
        }, 1200);
        return;
      }
      setManualCheckFailed(true);
    } catch {
      setManualCheckFailed(true);
    } finally {
      setManualCheckLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmitNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newEmail) {
      newErrors.newEmail = "Ingresá tu nuevo correo electrónico";
    } else if (!validateEmail(newEmail)) {
      newErrors.newEmail = "Ingresá un correo electrónico válido";
    } else if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      newErrors.newEmail = "El nuevo correo no puede ser igual al actual";
    }

    if (!confirmEmail) {
      newErrors.confirmEmail = "Confirmá tu nuevo correo electrónico";
    } else if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Los correos electrónicos no coinciden";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);

      const auth = getAuth();
      const u = auth.currentUser;
      if (!u) throw new Error("No hay sesión activa.");

      const actionCodeSettings = {
        url: `${window.location.origin}/?emailChanged=1`,
        handleCodeInApp: false,
      };

      // ✅ FLUJO CORRECTO: manda link al nuevo correo y SOLO se aplica al dar click
      await verifyBeforeUpdateEmail(u, newEmail.trim(), actionCodeSettings);

      setStep("waitingVerification");
      setCountdown(30);
      setIsResendEnabled(false);

      toast.success("Email de verificación enviado", {
        description: `Revisá ${newEmail} y hacé clic en el enlace para confirmar el cambio`,
        duration: 5000,
      });
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/requires-recent-login") {
        toast.error("Necesitás re-iniciar sesión", {
          description:
            "Por seguridad, Firebase requiere que vuelvas a iniciar sesión para cambiar el correo.",
          duration: 6000,
        });
      } else {
        toast.error("No se pudo enviar la verificación", {
          description: err?.message || "Intentá de nuevo.",
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsResendEnabled(false);
      setCountdown(30);
      setIsLoading(true);

      const auth = getAuth();
      const u = auth.currentUser;
      if (!u) throw new Error("No hay sesión activa.");

      const actionCodeSettings = {
        url: `${window.location.origin}/?emailChanged=1`,
        handleCodeInApp: false,
      };

      await verifyBeforeUpdateEmail(u, newEmail.trim(), actionCodeSettings);

      toast.success("Email reenviado", {
        description: `Te enviamos un nuevo enlace a ${newEmail}`,
        duration: 3000,
      });
    } catch (e: any) {
      toast.error("No se pudo reenviar", {
        description: e?.message || "Intentá de nuevo.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step === "waitingVerification") {
      setStep("enterEmail");
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white rounded-3xl overflow-hidden border-none">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#FF6B00] via-[#FF8534] to-[#FFA500] p-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <DialogTitle
              className="text-white"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              Cambiar correo
            </DialogTitle>
          </div>

          <DialogDescription
            className="text-white/90 mt-2"
            style={{ fontSize: "0.938rem" }}
          >
            {step === "enterEmail" && "Ingresá tu nuevo correo electrónico"}
            {step === "waitingVerification" && "Verificá tu nuevo correo"}
            {step === "success" && "¡Verificación exitosa!"}
          </DialogDescription>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 1: Enter New Email */}
          {step === "enterEmail" && (
            <form onSubmit={handleSubmitNewEmail} className="space-y-4">
              {/* Current Email - Read Only */}
              <div>
                <Label
                  className="text-[#2E2E2E] mb-2 block"
                  style={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Correo actual
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2E2E2E]/40" />
                  <Input
                    type="email"
                    value={currentEmail}
                    disabled
                    className="pl-10 py-5 rounded-xl bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
                    style={{ fontSize: "0.938rem" }}
                  />
                </div>
              </div>

              {/* New Email */}
              <div>
                <Label
                  htmlFor="newEmail"
                  className="text-[#2E2E2E] mb-2 block"
                  style={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Nuevo correo electrónico{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2E2E2E]/50" />
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setErrors({ ...errors, newEmail: "" });
                    }}
                    placeholder="tunuevo@email.com"
                    className={`pl-10 py-5 rounded-xl border-2 transition-all
                      ${
                        errors.newEmail
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                      } focus:ring-4`}
                    style={{ fontSize: "0.938rem" }}
                    autoFocus
                  />
                </div>
                {errors.newEmail && (
                  <p
                    className="mt-2 text-red-500 flex items-center gap-1"
                    style={{ fontSize: "0.813rem" }}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.newEmail}
                  </p>
                )}
              </div>

              {/* Confirm Email */}
              <div>
                <Label
                  htmlFor="confirmEmail"
                  className="text-[#2E2E2E] mb-2 block"
                  style={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Confirmar nuevo correo <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2E2E2E]/50" />
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => {
                      setConfirmEmail(e.target.value);
                      setErrors({ ...errors, confirmEmail: "" });
                    }}
                    placeholder="tunuevo@email.com"
                    className={`pl-10 py-5 rounded-xl border-2 transition-all
                      ${
                        errors.confirmEmail
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20"
                      } focus:ring-4`}
                    style={{ fontSize: "0.938rem" }}
                  />
                </div>
                {errors.confirmEmail && (
                  <p
                    className="mt-2 text-red-500 flex items-center gap-1"
                    style={{ fontSize: "0.813rem" }}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmEmail}
                  </p>
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-[#FFF4E6] rounded-xl p-4 border-2 border-[#FF6B00]/20">
                <p
                  className="text-[#2E2E2E] flex items-start gap-2"
                  style={{ fontSize: "0.813rem" }}
                >
                  <AlertCircle className="w-4 h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                  <span>
                    Te enviaremos un enlace de verificación a tu nuevo correo
                    electrónico para confirmar el cambio.
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Waiting for Email Verification */}
          {step === "waitingVerification" && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div className="bg-[#FFF4E6] rounded-xl p-5 border-2 border-[#FF6B00]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div>
                    <p
                      className="text-[#1C2335] mb-1"
                      style={{ fontSize: "0.938rem", fontWeight: 600 }}
                    >
                      Revisá tu correo electrónico
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.875rem" }}
                    >
                      Te enviamos un email a:
                    </p>
                    <p
                      className="text-[#FF6B00] mt-1"
                      style={{ fontSize: "0.938rem", fontWeight: 600 }}
                    >
                      {newEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                <p
                  className="text-[#2E2E2E] mb-3"
                  style={{ fontSize: "0.875rem", fontWeight: 600 }}
                >
                  ¿Qué hacer ahora?
                </p>
                <ol
                  className="space-y-2 text-[#2E2E2E]"
                  style={{ fontSize: "0.875rem" }}
                >
                  <li className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center"
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      1
                    </span>
                    <span>Abrí tu casilla de email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center"
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      2
                    </span>
                    <span>Buscá el email de HeyPoint!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center"
                      style={{ fontSize: "0.75rem", fontWeight: 600 }}
                    >
                      3
                    </span>
                    <span>Hacé clic en "Verificar correo electrónico"</span>
                  </li>
                </ol>
              </div>

              {/* Loading indicator / manual check */}
              {!pollingTimedOut ? (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin mx-auto mb-3" />
                  <p
                    className="text-[#2E2E2E]/60"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Esperando verificación...
                  </p>
                </div>
              ) : (
                <div className="text-center py-2 space-y-3">
                  <p
                    className="text-[#2E2E2E]/70"
                    style={{ fontSize: "0.875rem" }}
                  >
                    ¿Ya hiciste clic en el enlace? Avisanos para continuar.
                  </p>
                  {manualCheckFailed && (
                    <p
                      className="text-red-500"
                      style={{ fontSize: "0.813rem" }}
                    >
                      No detectamos el cambio todavía. ¿Ya hiciste clic en el enlace?
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={manualCheckLoading}
                    className="w-full bg-[#FF6B00] hover:bg-[#e56000] disabled:opacity-50 text-white py-3 rounded-full font-semibold transition-all inline-flex items-center justify-center gap-2"
                    style={{ fontSize: "0.938rem" }}
                  >
                    {manualCheckLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Ya verifiqué"
                    )}
                  </button>
                </div>
              )}

              {/* Resend Email */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p
                    className="text-[#2E2E2E]/60"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Podés reenviar el email en{" "}
                    <span
                      className="text-[#FF6B00]"
                      style={{ fontWeight: 600 }}
                    >
                      {countdown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={!isResendEnabled || isLoading}
                    className="text-[#FF6B00] hover:text-[#e56000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    style={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reenviar email
                  </button>
                )}
              </div>

              {/* Back Button */}
              <Button
                type="button"
                onClick={handleGoBack}
                variant="outline"
                disabled={isLoading}
                className="w-full py-6 rounded-full border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] hover:text-[#FF6B00] transition-all"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                Volver
              </Button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3
                className="text-[#1C2335]"
                style={{ fontSize: "1.25rem", fontWeight: 700 }}
              >
                ¡Correo verificado!
              </h3>
              <p className="text-[#2E2E2E]/80" style={{ fontSize: "0.938rem" }}>
                Actualizando tu correo electrónico...
              </p>
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
