import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { ChangeEmailModal } from "../components/ChangeEmailModal";
import { 
  User, 
  Mail, 
  Phone, 
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
  RefreshCw
} from "lucide-react";

interface UserProfilePageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
}

export function UserProfilePage({ 
  onNavigate, 
  isLoggedIn = true, 
  onLogout,
  userName = "Juan Pérez",
  userEmail = "juan.perez@example.com"
}: UserProfilePageProps) {
  // Profile data state
  const [profileData, setProfileData] = useState({
    fullName: userName,
    email: userEmail,
    emailVerified: true, // Email is verified, so it's read-only
    phone: "1234567890",
    birthDate: "1995-06-15",
    dni: "12345678",
    pickupPoint: "Urb. Valle Arriba",
    apartmentNumber: "101"
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [originalData, setOriginalData] = useState({ ...profileData });

  // Password validation state
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUppercase: false,
    hasNumber: false,
    hasMinLength: false,
    hasSpecialChar: false
  });

  // Change email modal state
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);

  // Check if form has been modified
  useEffect(() => {
    const dataChanged = JSON.stringify(profileData) !== JSON.stringify(originalData);
    const passwordChanged = passwordData.currentPassword !== "" || 
                           passwordData.newPassword !== "" || 
                           passwordData.confirmNewPassword !== "";
    setIsModified(dataChanged || passwordChanged);
  }, [profileData, passwordData, originalData]);

  // Validate password requirements
  useEffect(() => {
    if (passwordData.newPassword) {
      setPasswordRequirements({
        hasUppercase: /[A-Z]/.test(passwordData.newPassword),
        hasNumber: /[0-9]/.test(passwordData.newPassword),
        hasMinLength: passwordData.newPassword.length >= 8,
        hasSpecialChar: /[^A-Za-z0-9]/.test(passwordData.newPassword)
      });
    }
  }, [passwordData.newPassword]);

  const validateAge = (birthDate: string): boolean => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 16;
    }
    return age >= 16;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!profileData.fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido";
    } else if (!emailRegex.test(profileData.email)) {
      newErrors.email = "Por favor ingresa un correo válido";
    }

    // Phone validation
    if (!profileData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!/^\d{10}$/.test(profileData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "El teléfono debe tener 10 dígitos";
    }

    // Birth date validation
    if (!profileData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else if (!validateAge(profileData.birthDate)) {
      newErrors.birthDate = "Debes tener al menos 16 años";
    }

    // DNI validation
    if (!profileData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(profileData.dni)) {
      newErrors.dni = "El DNI debe tener 7 u 8 dígitos";
    }

    // Password validation (if user is changing password)
    if (passwordData.currentPassword || passwordData.newPassword || passwordData.confirmNewPassword) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Ingresa tu contraseña actual";
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = "Ingresa una nueva contraseña";
      } else if (!Object.values(passwordRequirements).every(req => req)) {
        newErrors.newPassword = "La contraseña no cumple con todos los requisitos";
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        newErrors.confirmNewPassword = "Las contraseñas no coinciden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setOriginalData({ ...profileData });
      
      // Reset password fields after successful save
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const handleCancel = () => {
    setProfileData({ ...originalData });
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    });
    setErrors({});
    setIsModified(false);
  };

  const handleEmailChanged = (newEmail: string) => {
    // Update profile data with new verified email
    setProfileData(prev => ({ ...prev, email: newEmail }));
    setOriginalData(prev => ({ ...prev, email: newEmail }));
    setShowChangeEmailModal(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader 
        onNavigate={onNavigate} 
        currentPage="profile" 
        isLoggedIn={isLoggedIn} 
        onLogout={onLogout}
        userName={profileData.fullName}
        isTransparent={false} 
      />

      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-6 py-8 md:py-12 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-8 md:mb-10">
              <h1 
                className="text-[#1C2335] mb-3" 
                style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700 }}
              >
                Mi perfil
              </h1>
              <p 
                className="text-[#2E2E2E]/70" 
                style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)' }}
              >
                Actualizá tu información personal y datos de retiro.
              </p>
            </div>

            {/* Profile Form Card */}
            <Card 
              className="border-none shadow-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%)',
                borderRadius: '24px'
              }}
            >
              <div className="p-6 md:p-10">
                {/* Success Message */}
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-700" style={{ fontSize: '0.938rem', fontWeight: 500 }}>
                      ¡Tu perfil se actualizó correctamente!
                    </p>
                  </motion.div>
                )}

                {/* Personal Information Section */}
                <div className="mb-8">
                  <h2 
                    className="text-[#1C2335] mb-6 pb-3 border-b border-gray-200" 
                    style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 600 }}
                  >
                    Información Personal
                  </h2>

                  <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                    {/* Full Name */}
                    <div>
                      <Label 
                        htmlFor="fullName" 
                        className="text-[#1C2335] mb-2 block" 
                        style={{ fontSize: '0.875rem', fontWeight: 600 }}
                      >
                        Nombre y Apellido <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                        <Input
                          id="fullName"
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          placeholder="Juan Pérez"
                          className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all text-[#1C2335]
                            ${errors.fullName 
                              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                              : 'border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20'
                            }`}
                          style={{ fontSize: '0.938rem' }}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-2 text-red-500 flex items-center gap-1.5" style={{ fontSize: '0.813rem', fontWeight: 600 }}>
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <Label 
                        htmlFor="email" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Correo electrónico <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="tu@email.com"
                          disabled={profileData.emailVerified}
                          className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                            ${profileData.emailVerified 
                              ? 'bg-gray-50 cursor-not-allowed opacity-70' 
                              : errors.email 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                        {profileData.emailVerified && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                      </div>
                      {profileData.emailVerified && (
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-[#2E2E2E]/60 text-xs">
                            Email verificado ✓
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowChangeEmailModal(true)}
                            className="text-[#FF6B00] hover:text-[#e56000] transition-colors inline-flex items-center gap-1"
                            style={{ fontSize: '0.813rem', fontWeight: 600 }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Cambiar correo
                          </button>
                        </div>
                      )}
                      {errors.email && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <Label 
                        htmlFor="phone" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Teléfono <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="1234567890"
                          className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                            ${errors.phone 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <Label 
                        htmlFor="birthDate" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Fecha de nacimiento <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="birthDate"
                          type="date"
                          value={profileData.birthDate}
                          onChange={(e) => handleInputChange("birthDate", e.target.value)}
                          className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                            ${errors.birthDate 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                      {errors.birthDate && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.birthDate}
                        </p>
                      )}
                    </div>

                    {/* DNI / ID */}
                    <div>
                      <Label 
                        htmlFor="dni" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        DNI / Documento <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="dni"
                          type="text"
                          value={profileData.dni}
                          onChange={(e) => handleInputChange("dni", e.target.value)}
                          placeholder="12345678"
                          className={`pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                            ${errors.dni 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                      {errors.dni && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.dni}
                        </p>
                      )}
                    </div>

                    {/* Pickup Point (Read-only) */}
                    <div>
                      <Label 
                        htmlFor="pickupPoint" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Point – ubicación de retiro
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="pickupPoint"
                          type="text"
                          value={profileData.pickupPoint}
                          disabled
                          className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-300 bg-gray-50 cursor-not-allowed opacity-70"
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                      <p className="mt-2 text-[#2E2E2E]/60" style={{ fontSize: '0.813rem' }}>
                        Este punto de retiro es administrado por HeyPoint!. No podés editarlo desde acá.
                      </p>
                    </div>

                    {/* Apartment Number */}
                    <div>
                      <Label 
                        htmlFor="apartmentNumber" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Número de departamento / módulo
                      </Label>
                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="apartmentNumber"
                          type="text"
                          value={profileData.apartmentNumber}
                          onChange={(e) => handleInputChange("apartmentNumber", e.target.value)}
                          placeholder="Ej: 101, A-5, Torre B-302"
                          className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 focus:ring-4 transition-all"
                          style={{ fontSize: '1rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="mb-8">
                  <h2 
                    className="text-[#1C2335] mb-6 pb-3 border-b border-gray-200" 
                    style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 600 }}
                  >
                    Cambiar contraseña
                  </h2>

                  <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                    {/* Current Password */}
                    <div className="md:col-span-2">
                      <Label 
                        htmlFor="currentPassword" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Contraseña actual
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                          placeholder="••••••••"
                          className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                            ${errors.currentPassword 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <Label 
                        htmlFor="newPassword" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Nueva contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                          placeholder="••••••••"
                          className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                            ${errors.newPassword 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <Label 
                        htmlFor="confirmNewPassword" 
                        className="text-[#2E2E2E] mb-2 block" 
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Confirmar nueva contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                        <Input
                          id="confirmNewPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmNewPassword}
                          onChange={(e) => handlePasswordChange("confirmNewPassword", e.target.value)}
                          placeholder="••••••••"
                          className={`pl-12 pr-12 py-6 rounded-2xl border-2 transition-all
                            ${errors.confirmNewPassword 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                            } focus:ring-4`}
                          style={{ fontSize: '1rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2E2E2E]/50 hover:text-[#FF6B00] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmNewPassword && (
                        <p className="mt-2 text-red-500 flex items-center gap-1" style={{ fontSize: '0.813rem' }}>
                          <AlertCircle className="w-4 h-4" />
                          {errors.confirmNewPassword}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    {passwordData.newPassword && (
                      <div className="md:col-span-2">
                        <div className="bg-[#FFF4E6] rounded-2xl p-4 space-y-2">
                          <p className="text-[#2E2E2E] mb-3" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            La contraseña debe cumplir con:
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasUppercase ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span 
                                className={passwordRequirements.hasUppercase ? "text-green-700" : "text-[#2E2E2E]/60"}
                                style={{ fontSize: '0.813rem' }}
                              >
                                ≥ 1 mayúscula (A-Z)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasNumber ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span 
                                className={passwordRequirements.hasNumber ? "text-green-700" : "text-[#2E2E2E]/60"}
                                style={{ fontSize: '0.813rem' }}
                              >
                                ≥ 1 número (0-9)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasMinLength ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span 
                                className={passwordRequirements.hasMinLength ? "text-green-700" : "text-[#2E2E2E]/60"}
                                style={{ fontSize: '0.813rem' }}
                              >
                                ≥ 8 caracteres
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {passwordRequirements.hasSpecialChar ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span 
                                className={passwordRequirements.hasSpecialChar ? "text-green-700" : "text-[#2E2E2E]/60"}
                                style={{ fontSize: '0.813rem' }}
                              >
                                ≥ 1 carácter especial (!@#$%^&*)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!isModified || isSaving}
                    className={`flex-1 sm:flex-none sm:ml-auto h-14 px-8 rounded-full transition-all shadow-lg
                      ${!isModified || isSaving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                        : 'bg-gradient-to-r from-[#FF6B00] to-[#FF8534] hover:from-[#e56000] hover:to-[#FF6B00] text-white hover:shadow-xl transform hover:scale-105'
                      }`}
                    style={{ fontSize: '1rem', fontWeight: 700 }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleCancel}
                    disabled={!isModified || isSaving}
                    variant="ghost"
                    className="sm:flex-none h-14 px-8 text-[#2E2E2E] hover:text-[#FF6B00] hover:bg-[#FFF4E6] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: '1rem', fontWeight: 600 }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />

      {/* Change Email Modal */}
      <ChangeEmailModal
        isOpen={showChangeEmailModal}
        onClose={() => setShowChangeEmailModal(false)}
        currentEmail={profileData.email}
        onEmailChanged={handleEmailChanged}
      />
    </div>
  );
}