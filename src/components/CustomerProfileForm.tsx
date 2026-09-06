import { AlertCircle, CheckCircle2, CreditCard, Home, Mail, MapPin, RefreshCw, User, XCircle } from "lucide-react";
import { BirthDateInput } from "./BirthDateInput";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type CustomerProfileFormData = {
  fullName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  birthDate: string;
  dni: string;
  pickupPoint: string;
  apartmentNumber: string;
};

type CustomerProfileFormProps = {
  profileData: CustomerProfileFormData;
  errors: Record<string, string>;
  profileComplete?: boolean | null;
  residenceAuthorizationAccepted: boolean;
  originalResidenceAuthorizationAccepted?: boolean;
  globalPickupPoint: string;
  onInputChange: (field: keyof CustomerProfileFormData, value: string) => void;
  onResidenceAuthorizationChange: (checked: boolean) => void;
  hasPasswordProvider?: boolean;
  checkingEmail?: boolean;
  resendCooldown?: number;
  onRefreshVerifiedState?: () => void;
  onResendVerification?: () => void;
  onChangeEmail?: () => void;
  showAccountActions?: boolean;
  showPendingHints?: boolean;
  variant?: "profile" | "checkout";
};

export function CustomerProfileForm({
  profileData,
  errors,
  profileComplete = null,
  residenceAuthorizationAccepted,
  originalResidenceAuthorizationAccepted = false,
  globalPickupPoint,
  onInputChange,
  onResidenceAuthorizationChange,
  hasPasswordProvider = false,
  checkingEmail = false,
  resendCooldown = 0,
  onRefreshVerifiedState,
  onResendVerification,
  onChangeEmail,
  showAccountActions = true,
  showPendingHints = true,
  variant = "profile",
}: CustomerProfileFormProps) {
  const isCheckoutVariant = variant === "checkout";
  const isMissingWhileIncomplete = (field: keyof CustomerProfileFormData) =>
    showPendingHints &&
    profileComplete === false &&
    !errors[field as string] &&
    !String(profileData[field] || "").trim();

  const pendingFieldClass = (field: keyof CustomerProfileFormData) =>
    isMissingWhileIncomplete(field)
      ? "border-[#FF6B00]/60 bg-[#FFF9F0]"
      : "border-gray-300";

  return (
    <div className={isCheckoutVariant ? "mb-6" : "mb-8"}>
      {!isCheckoutVariant && (
        <h2
          className="text-[#1C2335] mb-6 pb-3 border-b border-gray-200"
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 600,
          }}
        >
          Información Personal
        </h2>
      )}

      <p className="text-xs font-semibold text-[#2E2E2E]/45 uppercase tracking-wider mb-4">
        {isCheckoutVariant ? "Tu cuenta" : "Datos personales"}
      </p>
      {isCheckoutVariant ? (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-[#1C2335]" style={{ fontSize: "1rem", fontWeight: 700 }}>
                {profileData.fullName || "Usuario"}
              </p>
              <p className="mt-0.5 truncate text-[#2E2E2E]/65" style={{ fontSize: "0.875rem" }}>
                {profileData.email}
              </p>
            </div>
            <span className={`mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold sm:mt-0 ${
              profileData.emailVerified
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {profileData.emailVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {profileData.emailVerified ? "Email verificado" : "Email no verificado"}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-6">
          <div>
            <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <Input
                value={profileData.fullName}
                onChange={(e) => onInputChange("fullName", e.target.value)}
                placeholder="Juan Pérez"
                className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all text-[#1C2335] ${
                  errors.fullName
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-2 text-red-500 flex items-center gap-1.5" style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Correo electrónico <span className="text-red-500">*</span>
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
                {profileData.emailVerified ? "Email verificado ✓" : "Email NO verificado"}
              </p>

              {showAccountActions && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onRefreshVerifiedState}
                    className="text-[#2E2E2E]/70 hover:text-[#1C2335] transition-colors inline-flex items-center gap-1"
                    style={{ fontSize: "0.813rem", fontWeight: 600 }}
                    disabled={checkingEmail}
                    title="Revisar verificación"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingEmail ? "animate-spin" : ""}`} />
                    {checkingEmail ? "Revisando..." : "Revisar"}
                  </button>

                  {!profileData.emailVerified && (
                    <button
                      type="button"
                      onClick={onResendVerification}
                      disabled={resendCooldown > 0}
                      className={`transition-colors inline-flex items-center gap-1 ${
                        resendCooldown > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#FF6B00] hover:text-[#e56000]"
                      }`}
                      style={{ fontSize: "0.813rem", fontWeight: 600 }}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar verificación"}
                    </button>
                  )}

                  {hasPasswordProvider ? (
                    <button
                      type="button"
                      onClick={onChangeEmail}
                      className="text-[#FF6B00] hover:text-[#e56000] transition-colors inline-flex items-center gap-1"
                      style={{ fontSize: "0.813rem", fontWeight: 600 }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Cambiar correo
                    </button>
                  ) : (
                    <span className="text-[#2E2E2E]/50 inline-flex items-center gap-1" style={{ fontSize: "0.813rem" }}>
                      Tu correo está gestionado por Google.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-[#2E2E2E]/45 uppercase tracking-wider mb-4">
        Datos necesarios
      </p>
      <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-6">

        <div>
          <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <div className={`flex items-stretch rounded-2xl border-2 transition-all overflow-hidden ${
            errors.phone
              ? "border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/20"
              : `${pendingFieldClass("phone")} focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/20`
          }`}>
            <span className="flex-shrink-0 flex items-center pl-4 pr-3 text-sm font-medium text-gray-400 select-none pointer-events-none border-r border-gray-200">
              +54
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={profileData.phone}
              maxLength={10}
              onChange={(e) => onInputChange("phone", e.target.value)}
              placeholder="11 2345 6789"
              className="flex-1 pl-3 pr-4 py-3.5 text-base bg-transparent outline-none text-[#1C2335] placeholder:text-gray-400"
            />
          </div>
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
          {isMissingWhileIncomplete("phone") && <PendingHint />}
        </div>

        <div>
          <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            DNI / N° de documento <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
            <Input
              type="text"
              value={profileData.dni}
              onChange={(e) => onInputChange("dni", e.target.value)}
              placeholder="Ej: 12345678"
              inputMode="numeric"
              maxLength={8}
              pattern="[0-9]*"
              className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all ${
                errors.dni
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : `${pendingFieldClass("dni")} focus:border-[#FF6B00] focus:ring-[#FF6B00]/20`
              } focus:ring-4`}
            />
          </div>
          {errors.dni && <FieldError>{errors.dni}</FieldError>}
          {isMissingWhileIncomplete("dni") && <PendingHint />}
        </div>

        <div className="md:col-span-2">
          <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Fecha de nacimiento <span className="text-red-500">*</span>
          </Label>
          <BirthDateInput
            value={profileData.birthDate}
            hasError={!!errors.birthDate}
            onChange={(value) => onInputChange("birthDate", value)}
          />
          {errors.birthDate && <FieldError>{errors.birthDate}</FieldError>}
          {isMissingWhileIncomplete("birthDate") && <PendingHint />}
        </div>
      </div>

      <div className={isCheckoutVariant ? "border-t border-gray-200 pt-5" : "rounded-2xl bg-[#FFF9F4] border border-orange-100 p-4 md:p-5"}>
        <p className="text-xs font-semibold text-[#2E2E2E]/45 uppercase tracking-wider mb-4">
          Datos de retiro
        </p>
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {isCheckoutVariant ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2E2E2E]/45">
                Retiro en
              </p>
              <div className="mt-2 flex items-start gap-2 text-[#1C2335]">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF6B00]" />
                <p className="leading-snug" style={{ fontSize: "0.938rem", fontWeight: 700 }}>
                  {profileData.pickupPoint}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
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
              <p className="mt-2 text-[#2E2E2E]/60" style={{ fontSize: "0.813rem" }}>
                Este punto de retiro es administrado por Hey!Point. No podés editarlo desde acá.
              </p>
            </div>
          )}

          <div>
            <Label className="text-[#1C2335] mb-2 block" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              UF <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
              <Input
                type="text"
                value={profileData.apartmentNumber}
                onChange={(e) => onInputChange("apartmentNumber", e.target.value)}
                placeholder="Ej: 101"
                inputMode="numeric"
                maxLength={3}
                pattern="[0-9]*"
                className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all ${
                  errors.apartmentNumber
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 focus:ring-4"
                    : `${pendingFieldClass("apartmentNumber")} focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 focus:ring-4`
                }`}
              />
            </div>
            {errors.apartmentNumber && <FieldError>{errors.apartmentNumber}</FieldError>}
            {isMissingWhileIncomplete("apartmentNumber") && <PendingHint />}
          </div>

          <div className="md:col-span-2">
            <label
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                errors.residenceAuthorization
                  ? "border-red-200 bg-red-50"
                  : residenceAuthorizationAccepted
                    ? "border-[#FF6B00]/20 bg-[#FFF4E6]"
                    : "border-orange-100 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={residenceAuthorizationAccepted}
                disabled={originalResidenceAuthorizationAccepted}
                onChange={(event) => onResidenceAuthorizationChange(event.target.checked)}
                className="mt-1 w-4 h-4 flex-shrink-0 rounded border-gray-300 accent-[#FF6B00] disabled:cursor-not-allowed"
              />
              <span className="text-[#2E2E2E]/75 leading-relaxed" style={{ fontSize: "0.9rem" }}>
                Declaro que soy residente o estoy autorizado a utilizar los servicios de Hey!Point en{" "}
                <span className="font-semibold text-[#1C2335]">{globalPickupPoint}</span>.
                {originalResidenceAuthorizationAccepted && (
                  <span className="mt-1 block text-[#B45309] font-semibold">
                    Declaración aceptada.
                  </span>
                )}
              </span>
            </label>
            {errors.residenceAuthorization && (
              <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                <AlertCircle className="w-4 h-4" />
                {errors.residenceAuthorization}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: "0.813rem", fontWeight: 600 }}>
      <AlertCircle className="w-3.5 h-3.5" />
      {children}
    </p>
  );
}

function PendingHint() {
  return (
    <p className="mt-2 text-[#B45309]" style={{ fontSize: "0.813rem", fontWeight: 600 }}>
      Dato requerido para completar tu perfil.
    </p>
  );
}
