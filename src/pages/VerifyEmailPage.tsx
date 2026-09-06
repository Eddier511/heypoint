import { useCallback, useEffect, useRef, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { CheckCircle2, Mail, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { BackToTopButton } from "../components/BackToTopButton";
import { Footer } from "../components/Footer";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { auth } from "../config/firebaseClient";
import { useAuth } from "../contexts/AuthContext";

interface VerifyEmailPageProps {
  onNavigate?: (page: string) => void;
}

const EMAIL_RETURN_TO_KEY = "heypoint_email_return_to";
const EMAIL_RETURN_CHECKOUT = "checkout";
const PROFILE_RETURN_TO_KEY = "heypoint_profile_return_to";
const PROFILE_RETURN_CHECKOUT = "checkout";
const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmailPage({ onNavigate }: VerifyEmailPageProps) {
  const {
    currentUser,
    customerProfile,
    fetchMe,
    refreshEmailVerification,
    sendVerifyEmailPro,
  } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationNotice, setVerificationNotice] = useState("");
  const continuingRef = useRef(false);
  const lastAutoCheckRef = useRef(0);

  const continuePurchaseFlow = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (continuingRef.current) return;
      continuingRef.current = true;
      setChecking(true);
      try {
        const verified = await refreshEmailVerification();
        if (!verified) {
          if (!options.silent) {
            toast.error("Todavía no está verificado", {
              description: "Abrí el correo de verificación y confirmá tu cuenta.",
              duration: 4000,
            });
          }
          return;
        }

        const hasCheckoutIntent =
          sessionStorage.getItem(EMAIL_RETURN_TO_KEY) === EMAIL_RETURN_CHECKOUT;
        if (hasCheckoutIntent) {
          sessionStorage.removeItem(EMAIL_RETURN_TO_KEY);
        }

        const profile = customerProfile ?? (await fetchMe()).profile;
        if (hasCheckoutIntent && profile?.profileComplete === true) {
          sessionStorage.removeItem(PROFILE_RETURN_TO_KEY);
          onNavigate?.("checkout");
          return;
        }

        if (hasCheckoutIntent) {
          sessionStorage.setItem(PROFILE_RETURN_TO_KEY, PROFILE_RETURN_CHECKOUT);
          onNavigate?.("completeProfile");
          return;
        }

        toast.success("Correo verificado", {
          description: "Ya podés continuar usando tu cuenta.",
          duration: 3000,
        });
        onNavigate?.("cart");
      } catch (error: any) {
        if (!options.silent) {
          toast.error("No pudimos comprobar la verificación", {
            description: error?.message || "Intentá nuevamente en unos segundos.",
            duration: 4000,
          });
        }
      } finally {
        continuingRef.current = false;
        setChecking(false);
      }
    },
    [customerProfile, fetchMe, onNavigate, refreshEmailVerification],
  );

  useEffect(() => {
    if (!currentUser || currentUser.emailVerified !== true) return;
    continuePurchaseFlow({ silent: true });
  }, [continuePurchaseFlow, currentUser]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode");
    if (!oobCode) return;

    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        await applyActionCode(auth, oobCode);
        if (cancelled) return;
        setVerificationNotice("Tu correo fue verificado correctamente.");
        await continuePurchaseFlow({ silent: true });
      } catch (error: any) {
        if (!cancelled) {
          setVerificationNotice(error?.message || "No se pudo verificar el correo.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [continuePurchaseFlow]);

  useEffect(() => {
    if (!currentUser) return;

    const autoCheck = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastAutoCheckRef.current < 3000) return;
      lastAutoCheckRef.current = now;
      continuePurchaseFlow({ silent: true });
    };

    window.addEventListener("focus", autoCheck);
    document.addEventListener("visibilitychange", autoCheck);
    return () => {
      window.removeEventListener("focus", autoCheck);
      document.removeEventListener("visibilitychange", autoCheck);
    };
  }, [continuePurchaseFlow, currentUser]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    setSending(true);
    try {
      await sendVerifyEmailPro();
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("Correo enviado", {
        description: "Revisá tu bandeja de entrada o spam.",
        duration: 3500,
      });
    } catch (error: any) {
      toast.error("No pudimos reenviar el correo", {
        description: error?.message || "Intentá nuevamente en unos minutos.",
        duration: 4000,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="checkout"
        isLoggedIn={!!currentUser}
        userName={currentUser?.displayName || "Usuario"}
        isTransparent={false}
      />

      <BackToTopButton />

      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-6 py-8 md:py-12 max-w-2xl">
          <Card className="border-none rounded-3xl shadow-xl bg-white p-6 md:p-8">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF4E6] flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-[#FF6B00]" />
            </div>

            <h1
              className="text-[#1C2335] mb-3"
              style={{ fontSize: "clamp(1.875rem, 5vw, 2.5rem)", fontWeight: 700 }}
            >
              Verificá tu correo para continuar
            </h1>

            <p className="text-[#2E2E2E]/70 leading-relaxed mb-6">
              Enviamos un enlace de verificación a{" "}
              <span className="font-semibold text-[#1C2335]">
                {currentUser?.email || "tu correo"}
              </span>
              . Confirmá tu dirección para continuar con la compra.
            </p>

            {verificationNotice && (
              <div className="rounded-2xl border border-[#FF6B00]/20 bg-[#FFF9F0] px-4 py-3 mb-4 text-sm font-semibold text-[#2E2E2E]">
                {verificationNotice}
              </div>
            )}

            <div className="rounded-2xl border border-[#FF6B00]/20 bg-[#FFF9F0] p-4 mb-6">
              <div className="flex gap-3">
                <ShoppingCart className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#2E2E2E]/75 leading-relaxed">
                  Tu carrito se mantiene guardado. Cuando confirmemos el correo,
                  seguimos automáticamente con tu compra.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => continuePurchaseFlow()}
                disabled={!currentUser || checking}
                className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-full shadow-lg"
                style={{ fontWeight: 600 }}
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Ya verifiqué mi correo
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={!currentUser || sending || resendCooldown > 0}
                className="w-full py-6 rounded-full border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6]"
                style={{ fontWeight: 600 }}
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : resendCooldown > 0 ? (
                  `Reenviar en ${resendCooldown}s`
                ) : (
                  "Reenviar correo"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onNavigate?.("cart")}
                className="w-full rounded-full"
              >
                Volver al carrito
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
