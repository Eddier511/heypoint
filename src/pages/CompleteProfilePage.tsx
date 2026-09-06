import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, Loader2, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { BackToTopButton } from "../components/BackToTopButton";
import { CustomerProfileForm } from "../components/CustomerProfileForm";
import { Footer } from "../components/Footer";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { useStoreSettings } from "../hooks/useStoreSettings";
import {
  displayToIso,
  isoToDisplay,
  isValidDisplayDate,
  validateAge16,
} from "../lib/dateUtils";

type ApiProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  dni?: string;
  birthDate?: string;
  apartmentNumber?: string;
  profileComplete?: boolean;
  residenceAuthorizationAccepted?: boolean;
};

interface CompleteProfilePageProps {
  onNavigate?: (page: string) => void;
}

const PROFILE_RETURN_TO_KEY = "heypoint_profile_return_to";
const PROFILE_RETURN_CHECKOUT = "checkout";

function normalizeDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function limitDigits(v: string, maxLength: number) {
  return normalizeDigits(v).slice(0, maxLength);
}

function isValidDni(v: string) {
  const dni = String(v || "").trim();
  return /^\d{3,8}$/.test(dni) && !/^(\d)\1+$/.test(dni);
}

export function CompleteProfilePage({ onNavigate }: CompleteProfilePageProps) {
  const { currentUser, fetchMe, saveProfile, refreshEmailVerification } = useAuth();
  const { settings: storeSettings } = useStoreSettings();
  const globalPickupPoint =
    storeSettings?.pickupPoint?.address ||
    storeSettings?.pickupPoint?.name ||
    "Vilanova Haedo";

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [residenceAuthorizationAccepted, setResidenceAuthorizationAccepted] = useState(false);
  const [originalResidenceAuthorizationAccepted, setOriginalResidenceAuthorizationAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    emailVerified: !!currentUser?.emailVerified,
    phone: "",
    birthDate: "",
    dni: "",
    pickupPoint: globalPickupPoint,
    apartmentNumber: "",
  });

  const returnIntent = useMemo(
    () => sessionStorage.getItem(PROFILE_RETURN_TO_KEY),
    [],
  );

  const loadProfile = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      if (options.showLoading !== false) setPageLoading(true);
      setPageError("");

      try {
        const data = (await fetchMe()) as {
          exists: boolean;
          profile: ApiProfile | null;
        };
        const profile = data.profile || null;
        const api = profile || {};
        const verified = await refreshEmailVerification().catch(
          () => !!currentUser?.emailVerified,
        );
        const next = {
          fullName: api.fullName || currentUser?.displayName || "",
          email: currentUser?.email || api.email || "",
          emailVerified: verified,
          phone: limitDigits(api.phone || "", 10),
          birthDate: isoToDisplay(api.birthDate || ""),
          dni: limitDigits(api.dni || "", 8),
          pickupPoint: globalPickupPoint,
          apartmentNumber: limitDigits(api.apartmentNumber || "", 3),
        };

        setProfileComplete(profile?.profileComplete ?? null);
        setResidenceAuthorizationAccepted(api.residenceAuthorizationAccepted === true);
        setOriginalResidenceAuthorizationAccepted(api.residenceAuthorizationAccepted === true);
        setProfileData(next);
        return profile;
      } catch (error) {
        console.error("[CompleteProfilePage] profile fetch failed", error);
        setProfileComplete(null);
        setPageError("No pudimos cargar tus datos. Intentá nuevamente en unos segundos.");
        return null;
      } finally {
        if (options.showLoading !== false) setPageLoading(false);
      }
    },
    [currentUser, fetchMe, globalPickupPoint, refreshEmailVerification],
  );

  useEffect(() => {
    if (!currentUser) {
      setPageLoading(false);
      return;
    }
    loadProfile();
  }, [currentUser, loadProfile]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!profileData.fullName.trim()) {
      nextErrors.fullName = "El nombre completo es requerido";
    }
    if (!profileData.email.trim()) {
      nextErrors.email = "El correo electrónico es requerido";
    }

    const phoneDigits = limitDigits(profileData.phone, 10);
    if (!phoneDigits || phoneDigits.length < 8) {
      nextErrors.phone = "El teléfono debe tener mínimo 8 dígitos";
    }

    if (!profileData.birthDate) {
      nextErrors.birthDate = "La fecha de nacimiento es requerida";
    } else if (!isValidDisplayDate(profileData.birthDate)) {
      nextErrors.birthDate = "Fecha inválida. Usá el formato dd/mm/aaaa";
    } else if (!validateAge16(displayToIso(profileData.birthDate))) {
      nextErrors.birthDate = "Debes tener al menos 16 años";
    }

    const dniTrim = limitDigits(profileData.dni, 8);
    if (!dniTrim) {
      nextErrors.dni = "El DNI es requerido";
    } else if (!isValidDni(dniTrim)) {
      nextErrors.dni = "El DNI debe tener entre 3 y 8 dígitos numéricos válidos";
    }

    const uf = limitDigits(profileData.apartmentNumber, 3);
    if (!uf || !/^\d{1,3}$/.test(uf)) {
      nextErrors.apartmentNumber = "Ingresá un número de UF válido (máx. 3 dígitos)";
    }

    if (!residenceAuthorizationAccepted) {
      nextErrors.residenceAuthorization =
        "Confirmá que sos residente o estás autorizado para utilizar Hey!Point.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof profileData, value: string) => {
    const rawValue = String(value || "");
    const nextValue =
      field === "apartmentNumber"
        ? rawValue.replace(/\D/g, "").slice(0, 3)
        : field === "dni"
          ? rawValue.replace(/\D/g, "").slice(0, 8)
          : field === "phone"
            ? rawValue.replace(/\D/g, "").slice(0, 10)
            : value;

    setProfileData((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    setPageError("");
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await saveProfile({
        fullName: profileData.fullName.trim(),
        phone: limitDigits(profileData.phone, 10),
        dni: limitDigits(profileData.dni, 8),
        birthDate: displayToIso(profileData.birthDate),
        apartmentNumber: limitDigits(profileData.apartmentNumber, 3),
        pickupPoint: globalPickupPoint,
        residenceAuthorizationAccepted,
      });
      const refreshedProfile = await loadProfile({ showLoading: false });

      if (
        refreshedProfile?.profileComplete === true &&
        sessionStorage.getItem(PROFILE_RETURN_TO_KEY) === PROFILE_RETURN_CHECKOUT
      ) {
        sessionStorage.removeItem(PROFILE_RETURN_TO_KEY);
        onNavigate?.("checkout");
        return;
      }

      setSaveSuccess(true);
      if (refreshedProfile?.profileComplete !== true) {
        toast.error("No pudimos continuar al pago todavía", {
          description: "Revisá los datos requeridos e intentá nuevamente.",
          duration: 4000,
        });
      }
    } catch (error: any) {
      setPageError(error?.message || "Error guardando cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="checkout"
        isLoggedIn={!!currentUser}
        userName={profileData.fullName || currentUser?.displayName || "Usuario"}
        isTransparent={false}
      />

      <BackToTopButton />

      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-6 py-8 md:py-12 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <button
              type="button"
              onClick={() => onNavigate?.("cart")}
              className="mb-6 inline-flex items-center gap-2 text-[#2E2E2E] hover:text-[#FF6B00] transition-colors"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al carrito
            </button>

            <div className="mb-8">
              <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#2E2E2E]/60">
                <span className="inline-flex items-center gap-1 text-[#FF6B00]">
                  <ShoppingBag className="w-4 h-4" />
                  Carrito
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1 text-[#FF6B00]">
                  <CheckCircle2 className="w-4 h-4" />
                  Datos
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  Pago
                </span>
              </div>
              <h1 className="text-center text-[#1C2335] mb-3" style={{ fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 800 }}>
                Datos para tu compra
              </h1>
              <p className="mx-auto max-w-2xl text-center text-[#2E2E2E]/70" style={{ fontSize: "clamp(1rem, 2.5vw, 1.125rem)" }}>
                Antes de continuar con el pago, necesitamos validar algunos datos de tu cuenta. Solo tendrás que hacerlo una vez.
              </p>
            </div>

            {!!pageError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-red-700" style={{ fontSize: "0.938rem", fontWeight: 600 }}>
                  {pageError}
                </p>
              </div>
            )}

            <Card className="border-none shadow-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%)", borderRadius: "24px" }}>
              <div className="p-6 md:p-10">
                {!currentUser ? (
                  <div className="py-16 text-center">
                    <h2 className="text-[#1C2335] text-xl font-bold">Iniciá sesión para continuar</h2>
                    <p className="mt-2 text-[#2E2E2E]/70">Necesitamos validar tu cuenta antes de avanzar con el pago.</p>
                  </div>
                ) : pageLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#FF6B00]" />
                    <p className="text-[#2E2E2E]/70">Cargando datos...</p>
                  </div>
                ) : (
                  <>
                    {saveSuccess && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-green-700" style={{ fontSize: "0.938rem", fontWeight: 600 }}>
                          Tus datos se guardaron correctamente.
                        </p>
                      </div>
                    )}

                    <CustomerProfileForm
                      profileData={profileData}
                      errors={errors}
                      profileComplete={profileComplete}
                      residenceAuthorizationAccepted={residenceAuthorizationAccepted}
                      originalResidenceAuthorizationAccepted={originalResidenceAuthorizationAccepted}
                      globalPickupPoint={globalPickupPoint}
                      onInputChange={handleInputChange}
                      onResidenceAuthorizationChange={(checked) => {
                        setResidenceAuthorizationAccepted(checked);
                        if (checked) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.residenceAuthorization;
                            return next;
                          });
                        }
                      }}
                      showAccountActions={false}
                    />

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto min-h-[52px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#e56000] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ fontSize: "1rem", fontWeight: 800 }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          "Continuar al pago"
                        )}
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
    </div>
  );
}
