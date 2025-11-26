import { useState, useCallback, useEffect } from "react";
import { X, Mail, Lock, User, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Chrome, Phone, CreditCard, Calendar, MapPin, ChevronRight, Check, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useAuth } from "../contexts/AuthContext";
import { logger } from "../utils/logger";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData?: any) => void;
  onSignUpSuccess?: (email: string, fullName?: string) => void;
  onGoogleSignUpSuccess?: (fullName: string) => void;
  defaultMode?: "login" | "signup";
}

// Sign-up state machine
type SignUpStep = "form" | "verifyEmail" | "completeProfile" | "done";

// Password strength calculation
const calculatePasswordStrength = (password: string): { strength: "weak" | "medium" | "strong"; score: number } => {
  let score = 0;
  
  if (password.length >= 8) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  
  if (score <= 25) return { strength: "weak", score };
  if (score <= 75) return { strength: "medium", score };
  return { strength: "strong", score };
};

// Password requirements check
const checkPasswordRequirements = (password: string) => ({
  length: password.length >= 8,
  case: /[a-z]/.test(password) && /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
});

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  onSignUpSuccess,
  onGoogleSignUpSuccess,
  defaultMode = "login" 
}: AuthModalProps) {
  const { startGoogleOAuth } = useAuth();
  
  // Tab and step state
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultMode);
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("form");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // User data across steps
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingFullName, setPendingFullName] = useState("");
  
  // Form states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [readyToClose, setReadyToClose] = useState(false);
  
  // Verification step states
  const [verificationCountdown, setVerificationCountdown] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  
  // Complete profile step states
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [dni, setDni] = useState("");
  const [dniError, setDniError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [pickupPoint] = useState("Urb. Valle Arriba");
  
  // Unsaved changes tracking for Step 2
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // Step 2 unsaved changes tracking
  const [step2Dirty, setStep2Dirty] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // Reset to defaultMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultMode);
      // Check if user has verified email but not completed profile
      const savedEmail = localStorage.getItem('heypoint_pending_email');
      const savedName = localStorage.getItem('heypoint_pending_name');
      const isVerified = localStorage.getItem('heypoint_email_verified') === 'true';
      
      if (savedEmail && isVerified && defaultMode === 'signup') {
        // User verified email but didn't complete profile - skip to Step 2
        setPendingEmail(savedEmail);
        setPendingFullName(savedName || '');
        setIsEmailVerified(true);
        setSignUpStep('completeProfile');
      } else {
        setSignUpStep('form');
      }
      // Reset step2Dirty when modal first opens
      setStep2Dirty(false);
    }
  }, [isOpen, defaultMode]);

  // Guard against immediate close after opening
  useEffect(() => {
    if (isOpen) {
      // Wait one frame so the opening click cannot close it
      const id = requestAnimationFrame(() => setReadyToClose(true));
      return () => {
        cancelAnimationFrame(id);
        setReadyToClose(false);
      };
    } else {
      setReadyToClose(false);
    }
  }, [isOpen]);
  
  // Countdown timer for email verification
  useEffect(() => {
    if (signUpStep === 'verifyEmail' && verificationCountdown > 0 && !isResendEnabled) {
      const timer = setTimeout(() => {
        setVerificationCountdown(prev => {
          if (prev <= 1) {
            setIsResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationCountdown, signUpStep, isResendEnabled]);

  // Reset signUpStep when switching to Sign In
  useEffect(() => {
    if (activeTab === "login") {
      setSignUpStep("form");
    }
  }, [activeTab]);

  // Self-check: log dirty state and step changes
  useEffect(() => {
    logger.log("[AuthModal] step2Dirty=", step2Dirty, "step=", signUpStep);
  }, [step2Dirty, signUpStep]);

  // Guarded close with unsaved changes check
  const guardedClose = useCallback(() => {
    logger.log("[AuthModal guardedClose] Checking - step:", signUpStep, "dirty:", step2Dirty);
    if (signUpStep === "completeProfile" && step2Dirty) {
      logger.log("[AuthModal guardedClose] Showing confirm dialog");
      setShowConfirmLeave(true);
      return;
    }
    logger.log("[AuthModal guardedClose] Closing modal");
    onClose();
  }, [signUpStep, step2Dirty, onClose]);

  // Esc key listener for guarded close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        guardedClose();
      }
    };
    
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, guardedClose]);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!readyToClose) return; // ignore the very first click after open
    if (e.target === e.currentTarget) guardedClose();
  };
  
  const handleGoogleSignIn = async () => {
    try {
      const user = await startGoogleOAuth();
      
      if (activeTab === "login") {
        // Existing user logging in
        onLoginSuccess(user);
        onClose();
      } else {
        // New Google sign up - skip verification, go to complete profile
        setPendingEmail(user.email);
        setPendingFullName(user.fullName);
        setIsEmailVerified(true); // Google email is pre-verified
        setSignUpStep("completeProfile");
        
        if (onGoogleSignUpSuccess) {
          onGoogleSignUpSuccess(user.fullName);
        }
      }
    } catch (error) {
      console.error("Google OAuth failed:", error);
      // Show non-blocking error - don't close modal
    }
  };

  const handleManualSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess();
    onClose();
  };

  const handleManualSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // [TEMP] Verify form submission is working
    console.log("✅ Sign Up form submitted!");
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail)) {
      setEmailError("Ingresá un correo electrónico válido");
      return;
    }
    
    // Validate password strength
    const { strength } = calculatePasswordStrength(signUpPassword);
    if (strength === "weak") {
      setPasswordError("La contraseña es muy débil. Cumplí con todos los requisitos.");
      return;
    }
    
    // Clear errors and proceed to verification
    setEmailError("");
    setPasswordError("");
    
    // Store pending data and move to verification step
    setPendingEmail(signUpEmail);
    setPendingFullName(signUpFullName);
    
    // Persist to localStorage for recovery
    localStorage.setItem('heypoint_pending_email', signUpEmail);
    localStorage.setItem('heypoint_pending_name', signUpFullName);
    localStorage.removeItem('heypoint_email_verified'); // Clear any old verified state
    
    setSignUpStep("verifyEmail");
    setVerificationCountdown(60);
    setIsResendEnabled(false);
    
    // DO NOT authenticate yet - user must verify email first
    if (onSignUpSuccess) {
      onSignUpSuccess(signUpEmail, signUpFullName);
    }
  };
  
  // Verify email step handlers
  const handleEmailVerified = () => {
    // Mark email as verified
    setIsEmailVerified(true);
    localStorage.setItem('heypoint_email_verified', 'true');
    
    // Move to Complete Profile - still NOT authenticated
    setStep2Dirty(false);
    setSignUpStep("completeProfile");
  };
  
  const handleChangeEmail = () => {
    setSignUpStep("form");
    setActiveTab("signup");
  };
  
  const handleResendVerification = () => {
    setVerificationCountdown(60);
    setIsResendEnabled(false);
    // Simulate resending email
    console.log("Resending verification email to:", pendingEmail);
  };
  
  const handleOpenGmail = () => {
    window.open("https://mail.google.com", "_blank");
  };
  
  // Validate age (minimum 16 years)
  const validateAge = (birthDateValue: string): boolean => {
    if (!birthDateValue) return false;
    const today = new Date();
    const birth = new Date(birthDateValue);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 16;
    }
    return age >= 16;
  };
  
  // Complete profile step handler
  const handleProfileCompleted = (e: React.FormEvent) => {
    e.preventDefault();
    
    // [TEMP] Verify form submission is working
    console.log("✅ Complete Profile form submitted!");
    
    // Clear previous errors
    setPhoneError("");
    setDniError("");
    setBirthDateError("");
    
    let hasError = false;
    
    // Validate phone
    if (!phone || phone.length < 10) {
      setPhoneError("Please enter a valid phone number (at least 10 digits)");
      hasError = true;
    }
    
    // Validate DNI
    if (!dni || dni.length < 7 || dni.length > 10) {
      setDniError("DNI must be between 7-10 characters");
      hasError = true;
    }
    
    // Validate birth date
    if (!birthDate) {
      setBirthDateError("Date of birth is required");
      hasError = true;
    } else if (!validateAge(birthDate)) {
      setBirthDateError("You must be at least 16 years old");
      hasError = true;
    }
    
    if (hasError) return;
    
    // Clear localStorage persistence - profile is now complete
    localStorage.removeItem('heypoint_pending_email');
    localStorage.removeItem('heypoint_pending_name');
    localStorage.removeItem('heypoint_email_verified');
    
    // NOW authenticate the user - this is when they're actually logged in
    onLoginSuccess({
      email: pendingEmail,
      fullName: pendingFullName,
      phone,
      dni,
      birthDate,
      apartmentNumber,
      pickupPoint
    });
    
    setStep2Dirty(false);
    setSignUpStep("done");
    onClose();
  };

  // Forgot password handlers
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError("Por favor, ingresá un email válido");
      return;
    }
    
    // Clear error and simulate sending email
    setForgotPasswordError("");
    console.log("Sending password reset email to:", forgotPasswordEmail);
    
    // Show success state
    setForgotPasswordSent(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setForgotPasswordSent(false);
    setForgotPasswordError("");
    setActiveTab("login");
  };

  // Determine if we're in a multi-step flow
  const isMultiStepFlow = signUpStep !== "form";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-[8px] z-[9000]"
            onMouseDown={handleBackdropMouseDown}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto md:overflow-visible overscroll-contain pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col my-auto"
              style={{ maxHeight: 'min(88vh, 900px)' }}
            >
              {/* Close Button */}
              <button
                onClick={guardedClose}
                className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2E2E2E] flex items-center justify-center transition-all hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>

              {/* STEP 1: Auth Form (Login / Sign Up) */}
              {signUpStep === "form" && !showForgotPassword && (
                <>
                  {/* Header */}
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] text-white px-6 md:px-8 pt-6 pb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700 }}>
                        ¡Bienvenido a HeyPoint!
                      </h2>
                      <p className="mt-2 text-[#FFF4E6]" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                        {activeTab === "login" 
                          ? "Iniciá sesión para seguir comprando" 
                          : "Creá tu cuenta para empezar"}
                      </p>
                    </motion.div>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "login" | "signup")} className="w-full flex flex-col flex-1 overflow-hidden">
                    <TabsList className="flex-shrink-0 w-full grid grid-cols-2 h-12 md:h-14 text-sm md:text-base bg-[#FFF4E6] rounded-none border-b border-gray-200">
                      <TabsTrigger 
                        value="login" 
                        className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B00] rounded-none text-sm md:text-base"
                        style={{ fontWeight: 600 }}
                      >
                        Iniciar sesión
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        className="data-[state=active]:bg-white data-[state=active]:text-[#FF6B00] rounded-none text-sm md:text-base"
                        style={{ fontWeight: 600 }}
                      >
                        Crear cuenta
                      </TabsTrigger>
                    </TabsList>

                    {/* Single scrollable container for all tab content */}
                    <div className="flex-1 overflow-y-auto">
                      {/* Google Sign In Button */}
                      <div className="px-6 md:px-8 pt-8 pb-2">
                        <Button
                          onClick={handleGoogleSignIn}
                          variant="outline"
                          type="button"
                          className="w-full mb-6 py-6 rounded-2xl border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] transition-all group"
                          style={{ fontSize: '0.938rem', fontWeight: 600 }}
                        >
                          <Chrome className="w-5 h-5 mr-3 text-gray-600 group-hover:text-[#FF6B00] transition-colors" />
                          <span className="text-[#1C2335]">Continuar con Google</span>
                        </Button>

                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 bg-white text-gray-500" style={{ fontSize: '0.813rem', fontWeight: 500 }}>
                              o continuar con email
                            </span>
                          </div>
                        </div>
                      </div>

                      <TabsContent value="login" className="mt-0 px-6 md:px-8 pb-8">
                        <form onSubmit={handleManualSignIn} className="space-y-6">
                          <div>
                            <Label htmlFor="login-email" className="text-[#1C2335] mb-2 block" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Correo electrónico
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="login-email"
                                type="email"
                                placeholder="tu.email@ejemplo.com"
                                className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all duration-200 text-[#1C2335]"
                                style={{ fontSize: '0.938rem' }}
                                required
                              />
                            </div>
                            <p className="text-gray-500 mt-2 ml-1" style={{ fontSize: '0.75rem' }}>
                              Usá el correo con el que te registraste
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="login-password" className="text-[#1C2335] mb-2 block" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Contraseña
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="login-password"
                                type={showLoginPassword ? "text" : "password"}
                                placeholder="Ingresá tu contraseña"
                                className="pl-12 pr-12 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all duration-200 text-[#1C2335]"
                                style={{ fontSize: '0.938rem' }}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00] transition-all duration-200"
                              >
                                <motion.div
                                  initial={false}
                                  animate={{ scale: 1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {showLoginPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </motion.div>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00] focus:ring-2 cursor-pointer transition-all" 
                              />
                              <span className="text-[#2E2E2E] group-hover:text-[#1C2335] transition-colors" style={{ fontSize: '0.875rem' }}>
                                Recordarme
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowForgotPassword(true);
                              }}
                              className="text-[#FF6B00] hover:text-[#e56000] underline-offset-2 hover:underline transition-all"
                              style={{ fontSize: '0.875rem', fontWeight: 600 }}
                            >
                              ¿Olvidaste tu contraseña?
                            </button>
                          </div>

                          <div className="pt-2">
                            <Button
                              type="submit"
                              className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                              style={{ fontSize: '1rem', fontWeight: 600 }}
                            >
                              Iniciar sesión
                            </Button>
                            <p className="text-center text-gray-500 mt-3" style={{ fontSize: '0.813rem' }}>
                              ¿No tenés cuenta?{' '}
                              <button
                                type="button"
                                onClick={() => setActiveTab('signup')}
                                className="text-[#FF6B00] hover:text-[#e56000] transition-colors"
                                style={{ fontWeight: 600 }}
                              >
                                Creá una ahora
                              </button>
                            </p>
                          </div>
                        </form>
                      </TabsContent>

                      <TabsContent value="signup" className="mt-0 px-6 md:px-8 pb-8">
                        <form id="signUpForm" onSubmit={handleManualSignUp} className="space-y-6">
                          <div>
                            <Label htmlFor="signup-name" className="text-[#1C2335] mb-2 block" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Nombre completo
                            </Label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="signup-name"
                                type="text"
                                placeholder="Juan Pérez"
                                value={signUpFullName}
                                onChange={(e) => setSignUpFullName(e.target.value)}
                                className="pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-all duration-200 text-[#1C2335]"
                                style={{ fontSize: '0.938rem' }}
                                required
                              />
                            </div>
                            <p className="text-gray-500 mt-2 ml-1" style={{ fontSize: '0.75rem' }}>
                              Ingresá tu nombre y apellido
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="signup-email" className="text-[#1C2335] mb-2 block" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Correo electrónico
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="tuemail"
                                value={signUpEmail}
                                onChange={(e) => {
                                  setSignUpEmail(e.target.value);
                                  setEmailError("");
                                }}
                                className={`pl-12 pr-4 py-6 rounded-2xl border-2 ${
                                  emailError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B00]"
                                } focus:ring-2 ${
                                  emailError ? "focus:ring-red-500/20" : "focus:ring-[#FF6B00]/20"
                                } transition-all duration-200 text-[#1C2335]`}
                                style={{ fontSize: '0.938rem' }}
                                required
                              />
                            </div>
                            {/* Email domain chips */}
                            {signUpEmail && !signUpEmail.includes('@') && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 mt-2 ml-1"
                              >
                                <span className="text-gray-500" style={{ fontSize: '0.75rem' }}>Autocompletar:</span>
                                {['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com'].map((domain) => (
                                  <button
                                    key={domain}
                                    type="button"
                                    onClick={() => setSignUpEmail(signUpEmail + domain)}
                                    className="px-3 py-1 bg-[#FFF4E6] hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white rounded-full transition-all duration-200 border border-[#FF6B00]/20"
                                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                                  >
                                    {signUpEmail}{domain}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                            {emailError && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 mt-2 ml-1"
                                style={{ fontSize: '0.813rem' }}
                              >
                                {emailError}
                              </motion.p>
                            )}
                            {!emailError && signUpEmail && signUpEmail.includes('@') && (
                              <p className="text-gray-500 mt-2 ml-1" style={{ fontSize: '0.75rem' }}>
                                Usaremos este correo para verificar tu cuenta
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="signup-password" className="text-[#1C2335] mb-2 block" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              Contraseña
                            </Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                id="signup-password"
                                type={showSignUpPassword ? "text" : "password"}
                                placeholder="Creá una contraseña segura"
                                value={signUpPassword}
                                onChange={(e) => {
                                  setSignUpPassword(e.target.value);
                                  setPasswordError("");
                                }}
                                className={`pl-12 pr-12 py-6 rounded-2xl border-2 ${
                                  passwordError ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B00]"
                                } focus:ring-2 ${
                                  passwordError ? "focus:ring-red-500/20" : "focus:ring-[#FF6B00]/20"
                                } transition-all duration-200 text-[#1C2335]`}
                                style={{ fontSize: '0.938rem' }}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6B00] transition-all duration-200"
                              >
                                <motion.div
                                  initial={false}
                                  animate={{ scale: 1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  {showSignUpPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </motion.div>
                              </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {signUpPassword && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3"
                              >
                                {/* Strength Bar */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-gray-600" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                      Seguridad de la contraseña
                                    </span>
                                    <span
                                      className={`${
                                        calculatePasswordStrength(signUpPassword).strength === "weak"
                                          ? "text-red-500"
                                          : calculatePasswordStrength(signUpPassword).strength === "medium"
                                          ? "text-[#FF6B00]"
                                          : "text-green-500"
                                      }`}
                                      style={{ fontSize: '0.75rem', fontWeight: 700 }}
                                    >
                                      {calculatePasswordStrength(signUpPassword).strength === "weak" ? "DÉBIL" : calculatePasswordStrength(signUpPassword).strength === "medium" ? "MEDIA" : "FUERTE"}
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${calculatePasswordStrength(signUpPassword).score}%` }}
                                      transition={{ duration: 0.3 }}
                                      className={`h-full ${
                                        calculatePasswordStrength(signUpPassword).strength === "weak"
                                          ? "bg-red-500"
                                          : calculatePasswordStrength(signUpPassword).strength === "medium"
                                          ? "bg-[#FF6B00]"
                                          : "bg-green-500"
                                      }`}
                                    />
                                  </div>
                                </div>
                                
                                {/* Requirements Checklist */}
                                <div className="space-y-2 bg-[#FFF4E6] p-3 rounded-2xl border border-[#FF6B00]/10">
                                  {[
                                    { key: "length", text: "Al menos 8 caracteres" },
                                    { key: "case", text: "Mayúsculas y minúsculas" },
                                    { key: "number", text: "Al menos un número" },
                                    { key: "special", text: "Un carácter especial (@, #, $, etc.)" }
                                  ].map(({ key, text }) => {
                                    const requirements = checkPasswordRequirements(signUpPassword);
                                    const isMet = requirements[key as keyof typeof requirements];
                                    return (
                                      <motion.div
                                        key={key}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                                            isMet ? "bg-green-500 scale-110" : "bg-gray-300"
                                          }`}
                                        >
                                          {isMet && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span
                                          className={`transition-colors duration-200 ${
                                            isMet ? "text-[#1C2335]" : "text-gray-500"
                                          }`}
                                          style={{ fontSize: '0.75rem', fontWeight: isMet ? 600 : 400 }}
                                        >
                                          {text}
                                        </span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                            
                            {passwordError && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 mt-2 ml-1"
                                style={{ fontSize: '0.813rem', fontWeight: 600 }}
                              >
                                {passwordError}
                              </motion.p>
                            )}
                          </div>

                          <div className="pt-2">
                            <div className="flex items-start gap-3 mb-6">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#FF6B00] focus:ring-[#FF6B00] focus:ring-2 cursor-pointer transition-all" 
                                required 
                              />
                              <span className="text-[#2E2E2E] leading-snug" style={{ fontSize: '0.875rem' }}>
                                Acepto los{' '}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowTermsModal(true);
                                  }}
                                  className="text-[#FF6B00] hover:text-[#e56000] underline-offset-2 hover:underline transition-all"
                                  style={{ fontWeight: 600 }}
                                >
                                  Términos y Condiciones
                                </button>
                              </span>
                            </div>

                            <Button
                              type="submit"
                              className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                              style={{ fontSize: '1rem', fontWeight: 600 }}
                            >
                              Crear cuenta
                            </Button>
                            <p className="text-center text-gray-500 mt-3" style={{ fontSize: '0.813rem' }}>
                              ¿Ya tenés cuenta?{' '}
                              <button
                                type="button"
                                onClick={() => setActiveTab('login')}
                                className="text-[#FF6B00] hover:text-[#e56000] transition-colors"
                                style={{ fontWeight: 600 }}
                              >
                                Iniciá sesión
                              </button>
                            </p>
                          </div>
                        </form>
                      </TabsContent>
                    </div>
                  </Tabs>
                </>
              )}

              {/* STEP 2: Verify Email */}
              {signUpStep === "verifyEmail" && (
                <div className="flex flex-col h-full">
                  <div className="sticky top-0 z-10 bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden rounded-t-3xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 relative z-10"
                    >
                      <Mail className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h2 className="text-white mb-3 relative z-10" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 700 }}>
                      Verificá tu Email
                    </h2>
                    
                    <p className="text-white/90 mb-2 relative z-10" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      Enviamos un código de verificación a
                    </p>
                    
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full relative z-10">
                      <Mail className="w-4 h-4 text-white" />
                      <p className="text-white break-all" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.063rem)', fontWeight: 600 }}>
                        {pendingEmail}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 sm:px-8 py-6 sm:py-8 space-y-6 overflow-y-auto max-h-[calc(100dvh-18rem)] md:max-h-[60vh]">
                    <p className="text-[#2E2E2E] text-center leading-relaxed" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      Revisá tu bandeja de entrada y hacé clic en el enlace de verificación para activar tu cuenta.
                    </p>

                    <div className="space-y-4">
                      <Button
                        onClick={handleOpenGmail}
                        className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF4E00] hover:from-[#e56000] hover:to-[#e04500] text-white min-h-[3.5rem] rounded-full shadow-lg transition-all text-sm md:text-base"
                        style={{ fontWeight: 600 }}
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Abrir Gmail
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        onClick={handleResendVerification}
                        disabled={!isResendEnabled}
                        className={`w-full min-h-[3.5rem] rounded-full border-2 transition-all text-sm md:text-base
                          ${isResendEnabled 
                            ? "bg-white border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6]" 
                            : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"}`}
                        style={{ fontWeight: 600 }}
                      >
                        {isResendEnabled ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2" />
                            Reenviar email de verificación
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>Reenviar en {verificationCountdown}s</span>
                          </div>
                        )}
                      </Button>

                      <Button
                        onClick={handleChangeEmail}
                        variant="ghost"
                        className="w-full min-h-[3.5rem] rounded-full text-[#FF6B00] hover:bg-[#FFF4E6] text-sm md:text-base"
                        style={{ fontWeight: 500 }}
                      >
                        Usar otro email
                      </Button>

                      {/* DEV: Simulate verification button for testing */}
                      <Button
                        onClick={handleEmailVerified}
                        variant="ghost"
                        className="w-full text-[#2E2E2E]/60 hover:bg-gray-50 text-xs md:text-sm"
                      >
                        [DEV] Ya verifiqué mi email →
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-[#2E2E2E]/70 text-center leading-relaxed" style={{ fontSize: '0.8rem' }}>
                        ¿No recibiste el email? Revisá tu carpeta de spam o probá con otra dirección de correo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Complete Profile */}
              {signUpStep === "completeProfile" && (
                <>
                  {/* Header - Sticky */}
                  <div className="sticky top-0 z-10 bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 pt-8 sm:pt-10 pb-10 sm:pb-10 text-center relative overflow-hidden rounded-t-3xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 relative z-10"
                    >
                      <User className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h2 className="text-white mb-2 relative z-10" style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700 }}>
                      Completá tu Perfil
                    </h2>
                    
                    <p className="text-white/90 relative z-10" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      Paso 2 de 2
                    </p>
                  </div>

                  {/* Scrollable Body */}
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 max-h-[inherit] min-h-[200px]">
                    <form id="completeProfileForm" onSubmit={handleProfileCompleted} className="space-y-6">
                      {/* Welcome banner */}
                      {pendingFullName && (
                        <div className="bg-[#FFF4E6] border-l-4 border-[#FF6B00] p-4 rounded-r-2xl">
                          <p className="text-[#1C2335]" style={{ fontSize: '0.875rem' }}>
                            <span style={{ fontWeight: 600 }}>¡Bienvenido, {pendingFullName}!</span>
                            <br />
                            <span className="text-[#2E2E2E]/80">
                              Completá tu perfil para empezar a comprar en HeyPoint!
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Phone */}
                      <div>
                        <Label className="text-[#2E2E2E] mb-2 block text-sm md:text-base" style={{ fontWeight: 500 }}>
                          Número de teléfono <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                          <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              console.log("[AuthModal] Phone changed, marking dirty");
                              setPhone(e.target.value);
                              setPhoneError("");
                              setStep2Dirty(true);
                            }}
                            placeholder="1123456789"
                            className={`w-full pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                              ${phoneError 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                              } focus:ring-4`}
                            required
                          />
                        </div>
                        {phoneError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 mt-1 ml-4 text-xs md:text-sm"
                          >
                            {phoneError}
                          </motion.p>
                        )}
                      </div>

                      {/* DNI */}
                      <div>
                        <Label className="text-[#2E2E2E] mb-2 block text-sm md:text-base" style={{ fontWeight: 500 }}>
                          DNI <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                          <Input
                            type="text"
                            value={dni}
                            onChange={(e) => {
                              setDni(e.target.value);
                              setDniError("");
                              setStep2Dirty(true);
                            }}
                            placeholder="12345678"
                            className={`w-full pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                              ${dniError 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                              } focus:ring-4`}
                            required
                          />
                        </div>
                        {dniError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 mt-1 ml-4 text-xs md:text-sm"
                          >
                            {dniError}
                          </motion.p>
                        )}
                      </div>

                      {/* Birth Date */}
                      <div>
                        <Label className="text-[#2E2E2E] mb-2 block text-sm md:text-base" style={{ fontWeight: 500 }}>
                          Fecha de nacimiento <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50 pointer-events-none z-10" />
                          <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => {
                              setBirthDate(e.target.value);
                              setBirthDateError("");
                              setStep2Dirty(true);
                            }}
                            className={`w-full pl-12 pr-4 py-6 rounded-2xl border-2 transition-all
                              ${birthDateError 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                : 'border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20'
                              } focus:ring-4`}
                            required
                          />
                        </div>
                        {birthDateError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 mt-1 ml-4 text-xs md:text-sm"
                          >
                            {birthDateError}
                          </motion.p>
                        )}
                      </div>

                      {/* Hey Point! - Pickup Location (Read-only) */}
                      <div>
                        <Label className="text-[#2E2E2E] mb-2 block text-sm md:text-base" style={{ fontWeight: 500 }}>
                          Hey Point! – Ubicación de retiro
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/40 pointer-events-none z-10" />
                          <Input
                            type="text"
                            value={pickupPoint}
                            disabled
                            aria-readonly="true"
                            className="w-full pl-12 pr-4 py-6 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                          />
                        </div>
                        <p className="mt-1 ml-4 text-xs text-gray-500">
                          Este punto de retiro es administrado por HeyPoint!. No podés editarlo aquí.
                        </p>
                      </div>

                      {/* Apartment Number */}
                      <div>
                        <Label className="text-[#2E2E2E] mb-2 block text-sm md:text-base" style={{ fontWeight: 500 }}>
                          Número de departamento
                        </Label>
                        <Input
                          type="text"
                          value={apartmentNumber}
                          onChange={(e) => {
                            setApartmentNumber(e.target.value);
                            setStep2Dirty(true);
                          }}
                          placeholder="123"
                          className="w-full py-6 rounded-2xl border-2 border-gray-300 focus:border-[#FF6B00] focus:ring-[#FF6B00]/20 transition-all focus:ring-4"
                        />
                      </div>
                    </form>
                  </div>

                  {/* Sticky Footer with CTA */}
                  <div className="sticky bottom-0 z-10 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur border-t px-6 md:px-8 py-4">
                    <Button
                      type="submit"
                      form="completeProfileForm"
                      className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-full shadow-lg transition-all text-sm md:text-base"
                      style={{ fontWeight: 600 }}
                    >
                      Completar perfil
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </>
              )}

              {/* Forgot Password Flow */}
              {showForgotPassword && !forgotPasswordSent && (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden rounded-t-3xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    
                    {/* Back Button */}
                    <button
                      onClick={handleBackToLogin}
                      className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 relative z-10"
                    >
                      <Lock className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h2 className="text-white mb-3 relative z-10" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 700 }}>
                      Recuperá tu Contraseña
                    </h2>
                    
                    <p className="text-white/90 relative z-10 max-w-md mx-auto" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>

                  {/* Form */}
                  <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="forgot-email" className="text-[#2E2E2E] mb-2 block">
                          Correo electrónico
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2E2E2E]/50" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="tu.email@ejemplo.com"
                            value={forgotPasswordEmail}
                            onChange={(e) => {
                              setForgotPasswordEmail(e.target.value);
                              setForgotPasswordError("");
                            }}
                            className={`pl-12 py-6 rounded-full border-2 ${
                              forgotPasswordError ? "border-red-500" : "border-gray-200"
                            } focus:border-[#FF6B00] focus:ring-[#FF6B00] transition-all duration-200`}
                            required
                          />
                        </div>
                        {forgotPasswordError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-500 mt-1 ml-4"
                            style={{ fontSize: '0.875rem' }}
                          >
                            {forgotPasswordError}
                          </motion.p>
                        )}
                      </div>

                      <div className="bg-[#FFF4E6] border-l-4 border-[#FF6B00] p-4 rounded-r-2xl">
                        <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 600 }}>Importante:</span> El enlace de recuperación expirará en 1 hora por seguridad.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
                        style={{ fontSize: '1rem', fontWeight: 600 }}
                      >
                        Enviar enlace de recuperación
                      </Button>

                      <Button
                        type="button"
                        onClick={handleBackToLogin}
                        variant="ghost"
                        className="w-full text-[#FF6B00] hover:bg-[#FFF4E6] rounded-full"
                        style={{ fontSize: '0.938rem', fontWeight: 500 }}
                      >
                        Volver al inicio de sesión
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Forgot Password Success */}
              {showForgotPassword && forgotPasswordSent && (
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 py-8 sm:py-10 text-center relative overflow-hidden rounded-t-3xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 relative z-10"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h2 className="text-white mb-3 relative z-10" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 700 }}>
                      ¡Email Enviado!
                    </h2>
                    
                    <p className="text-white/90 mb-2 relative z-10" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                      Enviamos un enlace de recuperación a
                    </p>
                    
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full relative z-10">
                      <Mail className="w-4 h-4 text-white" />
                      <p className="text-white break-all" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.063rem)', fontWeight: 600 }}>
                        {forgotPasswordEmail}
                      </p>
                    </div>
                  </div>

                  {/* Success Content */}
                  <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8 space-y-6">
                    <div className="text-center space-y-4">
                      <p className="text-[#2E2E2E]" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Revisá tu bandeja de entrada y hacé clic en el enlace para restablecer tu contraseña.
                      </p>

                      <div className="bg-[#FFF4E6] border-l-4 border-[#FF6B00] p-4 rounded-r-2xl text-left">
                        <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 600 }}>Recordá:</span>
                        </p>
                        <ul className="mt-2 space-y-1 text-[#2E2E2E] ml-4" style={{ fontSize: '0.875rem' }}>
                          <li>• El enlace expira en 1 hora</li>
                          <li>• Revisá tu carpeta de spam si no lo ves</li>
                          <li>• El enlace solo puede usarse una vez</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleOpenGmail}
                        className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF4E00] hover:from-[#e56000] hover:to-[#e04500] text-white min-h-[3.5rem] rounded-full shadow-lg transition-all"
                        style={{ fontWeight: 600 }}
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Abrir Gmail
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        onClick={handleBackToLogin}
                        className="w-full bg-white border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FFF4E6] rounded-full py-6 transition-all"
                        style={{ fontWeight: 600 }}
                      >
                        Volver al inicio de sesión
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Confirm Leave Dialog */}
          {showConfirmLeave && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowConfirmLeave(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
              >
                <h3 className="text-[#1C2335] mb-2" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                  ¿Descartar cambios?
                </h3>
                <p className="text-[#2E2E2E] mb-5" style={{ fontSize: '0.875rem' }}>
                  Si salís ahora, tu progreso no se guardará.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowConfirmLeave(false)}
                    className="h-11 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-[#2E2E2E] flex items-center justify-center" 
                    style={{ fontWeight: 500 }}
                  >
                    Seguir editando
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmLeave(false);
                      onClose();
                    }}
                    className="h-11 rounded-xl bg-[#FF6B00] text-white hover:bg-[#e56000] transition-colors flex items-center justify-center"
                    style={{ fontWeight: 600 }}
                  >
                    Descartar
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Terms and Conditions Modal */}
          {showTermsModal && (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowTermsModal(false)}
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: 'min(90vh, 800px)' }}
              >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-br from-[#FF6B00] to-[#e56000] px-6 sm:px-8 py-6 sm:py-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 700 }}>
                      Términos y Condiciones de Uso
                    </h2>
                    <button
                      onClick={() => setShowTermsModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-white/90 mt-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    Última actualización: 15 de noviembre de 2025
                  </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
                  <div className="prose prose-sm sm:prose max-w-none">
                    {/* Section 1 */}
                    <h2 className="text-[#2E2E2E] mb-4">1. Aceptación de los Términos</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Bienvenido a Hey Point!. Al acceder y utilizar nuestro sistema de mini-tiendas inteligentes, 
                      usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con 
                      alguna parte de estos términos, por favor no utilice nuestros servicios.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      Hey Point! se reserva el derecho de actualizar, cambiar o reemplazar cualquier parte de estos 
                      Términos y Condiciones mediante la publicación de actualizaciones en nuestro sitio web. Es su 
                      responsabilidad revisar estos términos periódicamente para estar al tanto de los cambios.
                    </p>

                    {/* Section 2 */}
                    <h2 className="text-[#2E2E2E] mb-4">2. Descripción del Servicio</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Hey Point! es un sistema de mini-tiendas inteligentes que permite a los usuarios:
                    </p>
                    <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                      <li>Navegar y comprar productos a través de nuestra plataforma digital</li>
                      <li>Realizar pedidos en línea con pago electrónico seguro</li>
                      <li>Recoger productos en casilleros inteligentes automatizados</li>
                      <li>Acceder a productos 24/7 sin necesidad de personal de atención</li>
                      <li>Rastrear el estado de sus pedidos en tiempo real</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      Nuestro servicio está diseñado para proporcionar conveniencia, rapidez y seguridad en cada transacción.
                    </p>

                    {/* Section 3 */}
                    <h2 className="text-[#2E2E2E] mb-4">3. Registro y Cuenta de Usuario</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Para utilizar los servicios de Hey Point!, debe:
                    </p>
                    <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                      <li>Crear una cuenta proporcionando información precisa y completa</li>
                      <li>Ser mayor de 18 años o tener el consentimiento de un tutor legal</li>
                      <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                      <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                      <li>Actualizar su información personal cuando sea necesario</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      Usted es responsable de todas las actividades que ocurran bajo su cuenta. Hey Point! no será 
                      responsable por pérdidas o daños derivados del uso no autorizado de su cuenta.
                    </p>

                    {/* Section 4 */}
                    <h2 className="text-[#2E2E2E] mb-4">4. Proceso de Compra y Pago</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>4.1 Pedidos:</strong> Al realizar un pedido a través de Hey Point!, usted acepta:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                      <li>Proporcionar información de pago válida y autorizada</li>
                      <li>Pagar el precio total del pedido, incluyendo impuestos aplicables</li>
                      <li>Recoger su pedido dentro del plazo especificado</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>4.2 Precios:</strong> Todos los precios están expresados en la moneda local y pueden 
                      estar sujetos a cambios sin previo aviso. Hey Point! se reserva el derecho de corregir errores 
                      de precio antes de confirmar su pedido.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>4.3 Métodos de Pago:</strong> Aceptamos pagos mediante tarjetas de crédito, débito y 
                      otros métodos electrónicos seguros. Todos los pagos son procesados a través de plataformas 
                      certificadas y encriptadas.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      <strong>4.4 Confirmación:</strong> Recibirá una confirmación por correo electrónico una vez que 
                      su pedido sea procesado exitosamente. Esta confirmación incluirá los detalles del pedido y el 
                      código de acceso al casillero.
                    </p>

                    {/* Section 5 */}
                    <h2 className="text-[#2E2E2E] mb-4">5. Recogida de Productos</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>5.1 Plazo de Recogida:</strong> Los productos deben ser recogidos dentro de las 48 horas 
                      posteriores a la confirmación del pedido. Después de este período, Hey Point! se reserva el derecho 
                      de cancelar el pedido y procesar un reembolso.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>5.2 Código de Acceso:</strong> Para acceder a su pedido, debe utilizar el código único 
                      proporcionado en su confirmación. No comparta este código con terceros.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>5.3 Inspección:</strong> Le recomendamos inspeccionar sus productos inmediatamente después 
                      de recogerlos. Si encuentra algún problema, contáctenos dentro de las 24 horas.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      <strong>5.4 Productos Perecederos:</strong> Los productos alimenticios o perecederos deben ser 
                      recogidos lo antes posible. Hey Point! no se hace responsable por el deterioro de productos no 
                      recogidos a tiempo.
                    </p>

                    {/* Section 6 */}
                    <h2 className="text-[#2E2E2E] mb-4">6. Devoluciones y Reembolsos</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>6.1 Política de Devolución:</strong> Aceptamos devoluciones de productos en las siguientes 
                      condiciones:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                      <li>El producto está defectuoso o dañado</li>
                      <li>Recibió un producto incorrecto</li>
                      <li>El producto no coincide con la descripción</li>
                      <li>La solicitud se realiza dentro de las 24 horas posteriores a la recogida</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>6.2 Productos No Retornables:</strong> No se aceptan devoluciones de productos perecederos, 
                      artículos de higiene personal o productos que hayan sido abiertos o utilizados.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      <strong>6.3 Reembolsos:</strong> Los reembolsos aprobados serán procesados al método de pago 
                      original dentro de 5-10 días hábiles.
                    </p>

                    {/* Section 7 */}
                    <h2 className="text-[#2E2E2E] mb-4">7. Uso Apropiado del Servicio</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Usted se compromete a:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                      <li>Utilizar el servicio únicamente para fines legales</li>
                      <li>No intentar acceder a casilleros que no le corresponden</li>
                      <li>No dañar, alterar o interferir con el funcionamiento de los casilleros</li>
                      <li>No realizar actividades fraudulentas o engañosas</li>
                      <li>Respetar las instalaciones y el equipo de Hey Point!</li>
                      <li>No utilizar el servicio para actividades comerciales no autorizadas</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      El incumplimiento de estas normas puede resultar en la suspensión o terminación de su cuenta 
                      y posibles acciones legales.
                    </p>

                    {/* Section 8 */}
                    <h2 className="text-[#2E2E2E] mb-4">8. Propiedad Intelectual</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Todo el contenido disponible en Hey Point!, incluyendo pero no limitado a textos, gráficos, 
                      logos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es 
                      propiedad de Hey Point! o de sus proveedores de contenido y está protegido por leyes de 
                      propiedad intelectual.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      No está permitido reproducir, distribuir, modificar, crear trabajos derivados, mostrar públicamente 
                      o utilizar de cualquier manera el contenido sin el consentimiento previo por escrito de Hey Point!.
                    </p>

                    {/* Section 9 */}
                    <h2 className="text-[#2E2E2E] mb-4">9. Limitación de Responsabilidad</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      Hey Point! no será responsable por:
                    </p>
                    <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                      <li>Daños indirectos, incidentales, especiales o consecuentes</li>
                      <li>Pérdida de beneficios, datos o uso</li>
                      <li>Interrupciones del servicio por mantenimiento o causas fuera de nuestro control</li>
                      <li>Fallas técnicas o problemas de conectividad</li>
                      <li>Productos dejados en casilleros más allá del plazo de recogida</li>
                    </ul>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      En ningún caso la responsabilidad total de Hey Point! excederá el monto pagado por el producto 
                      o servicio en cuestión.
                    </p>

                    {/* Section 10 */}
                    <h2 className="text-[#2E2E2E] mb-4">10. Privacidad y Protección de Datos</h2>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      El uso de su información personal está regido por nuestra Política de Privacidad, la cual forma 
                      parte integral de estos Términos y Condiciones. Al utilizar nuestros servicios, usted acepta el 
                      tratamiento de sus datos personales según lo descrito en nuestra Política de Privacidad.
                    </p>

                    {/* Section 11 */}
                    <h2 className="text-[#2E2E2E] mb-4">11. Modificaciones del Servicio</h2>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      Hey Point! se reserva el derecho de modificar o discontinuar, temporal o permanentemente, el 
                      servicio (o cualquier parte del mismo) con o sin previo aviso. No seremos responsables ante 
                      usted o terceros por cualquier modificación, suspensión o discontinuación del servicio.
                    </p>

                    {/* Section 12 */}
                    <h2 className="text-[#2E2E2E] mb-4">12. Terminación de Cuenta</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>12.1 Por el Usuario:</strong> Puede cancelar su cuenta en cualquier momento contactando 
                      nuestro servicio al cliente o a través de la configuración de su cuenta.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      <strong>12.2 Por Hey Point!:</strong> Nos reservamos el derecho de suspender o terminar su cuenta 
                      si determina que ha violado estos términos, ha cometido fraude o ha utilizado el servicio de 
                      manera inapropiada.
                    </p>

                    {/* Section 13 */}
                    <h2 className="text-[#2E2E2E] mb-4">13. Ley Aplicable y Jurisdicción</h2>
                    <p className="text-[#2E2E2E]/80 mb-8">
                      Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes aplicables en 
                      la jurisdicción donde opera Hey Point!. Cualquier disputa relacionada con estos términos estará 
                      sujeta a la jurisdicción exclusiva de los tribunales competentes de dicha jurisdicción.
                    </p>

                    {/* Section 14 */}
                    <h2 className="text-[#2E2E2E] mb-4">14. Contacto</h2>
                    <p className="text-[#2E2E2E]/80 mb-4">
                      Si tiene preguntas, comentarios o inquietudes sobre estos Términos y Condiciones, puede contactarnos:
                    </p>
                    <ul className="list-none mb-8 text-[#2E2E2E]/80 space-y-2">
                      <li><strong>Email:</strong> legal@heypoint.com</li>
                      <li><strong>Teléfono:</strong> +1 (555) 123-4567</li>
                      <li><strong>Dirección:</strong> Hey Point! HQ, 123 Innovation Drive, Tech City</li>
                    </ul>

                    {/* Section 15 */}
                    <h2 className="text-[#2E2E2E] mb-4">15. Disposiciones Generales</h2>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>15.1 Integridad del Acuerdo:</strong> Estos Términos y Condiciones, junto con nuestra 
                      Política de Privacidad, constituyen el acuerdo completo entre usted y Hey Point!.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>15.2 Divisibilidad:</strong> Si alguna disposición de estos términos se considera inválida 
                      o inaplicable, las disposiciones restantes continuarán en pleno vigor y efecto.
                    </p>
                    <p className="text-[#2E2E2E]/80 mb-6">
                      <strong>15.3 Renuncia:</strong> El hecho de que Hey Point! no haga cumplir alguna disposición de 
                      estos términos no constituirá una renuncia a dicha disposición o a cualquier otra disposición.
                    </p>
                    <p className="text-[#2E2E2E]/80">
                      Al utilizar los servicios de Hey Point!, usted reconoce que ha leído, entendido y aceptado estar 
                      sujeto a estos Términos y Condiciones de Uso.
                    </p>
                  </div>
                </div>

                {/* Footer with Close Button */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 sm:px-8 py-4 bg-white">
                  <Button
                    onClick={() => setShowTermsModal(false)}
                    className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-full shadow-lg transition-all"
                    style={{ fontWeight: 600 }}
                  >
                    Cerrar
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;