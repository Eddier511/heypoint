import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { motion } from "motion/react";

interface TokenInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  variant?: "default" | "display"; // display for showing tokens in success page
  showExpiration?: boolean;
  expirationTime?: number; // in seconds
}

export function TokenInput({
  length = 6,
  value = "",
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
  className = "",
  variant = "default",
  showExpiration = false,
  expirationTime = 120 // 2 minutes default
}: TokenInputProps) {
  const [tokens, setTokens] = useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(expirationTime);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Sync internal state with external value
  useEffect(() => {
    if (value) {
      const newTokens = value.toUpperCase().split("").slice(0, length);
      while (newTokens.length < length) {
        newTokens.push("");
      }
      setTokens(newTokens);
    }
  }, [value, length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && variant === "default") {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, variant]);

  // Countdown timer for expiration
  useEffect(() => {
    if (showExpiration && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showExpiration, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, newValue: string) => {
    if (disabled || variant === "display") return;

    // Only allow alphanumeric characters
    const sanitized = newValue.toUpperCase().replace(/[^A-Z0-9]/g, "");
    
    if (sanitized.length === 0) {
      // Handle delete
      const newTokens = [...tokens];
      newTokens[index] = "";
      setTokens(newTokens);
      onChange?.(newTokens.join(""));
      return;
    }

    // Handle single character input
    if (sanitized.length === 1) {
      const newTokens = [...tokens];
      newTokens[index] = sanitized;
      setTokens(newTokens);
      onChange?.(newTokens.join(""));

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // All fields filled
        const fullToken = newTokens.join("");
        if (fullToken.length === length) {
          onComplete?.(fullToken);
        }
      }
      return;
    }

    // Handle paste of multiple characters
    if (sanitized.length > 1) {
      handlePaste(sanitized, index);
    }
  };

  const handlePaste = (pastedText: string, startIndex: number) => {
    const sanitized = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const newTokens = [...tokens];
    
    for (let i = 0; i < sanitized.length && startIndex + i < length; i++) {
      newTokens[startIndex + i] = sanitized[i];
    }
    
    setTokens(newTokens);
    onChange?.(newTokens.join(""));

    // Focus appropriate field
    const nextEmptyIndex = newTokens.findIndex(t => t === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
      const fullToken = newTokens.join("");
      if (fullToken.length === length) {
        onComplete?.(fullToken);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || variant === "display") return;

    if (e.key === "Backspace" && tokens[index] === "" && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasteEvent = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    handlePaste(pastedText, index);
  };

  if (variant === "display") {
    // Display variant for showing tokens (e.g., in success page)
    return (
      <div className={`flex items-center justify-center gap-2 sm:gap-3 ${className}`}>
        {tokens.map((token, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
            className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/40"
          >
            <span 
              className="text-white"
              style={{ 
                fontSize: 'clamp(1.75rem, 4vw, 3rem)', 
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              {token || "·"}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  // Input variant for entering tokens
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
        {tokens.map((token, index) => (
          <motion.div
            key={index}
            animate={
              focusedIndex === index && !error
                ? { scale: [1, 1.05, 1] }
                : {}
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <input
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="text"
              maxLength={1}
              value={token}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={e => handlePasteEvent(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              disabled={disabled}
              className={`
                w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-18
                text-center
                rounded-xl
                border-2
                transition-all duration-200
                outline-none
                ${token 
                  ? error
                    ? "border-red-500 bg-red-50 text-red-900"
                    : "border-[#FF6B00] bg-[#FFF4E6] text-[#1C2335]"
                  : focusedIndex === index
                    ? "border-[#FF6B00] bg-white text-[#1C2335]"
                    : error
                      ? "border-red-300 bg-white text-[#1C2335]"
                      : "border-gray-300 bg-white text-[#1C2335]"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}
                hover:${!disabled && !error ? "border-[#FF6B00]/60" : ""}
              `}
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
              aria-label={`Caracter ${index + 1} de ${length}`}
            />
          </motion.div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 text-center mb-2"
          style={{ fontSize: '0.875rem', fontWeight: 500 }}
        >
          {error}
        </motion.p>
      )}

      {/* Expiration countdown */}
      {showExpiration && countdown > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E2E2E] text-white"
          style={{ fontSize: '0.875rem', fontWeight: 600 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>El código expira en {formatTime(countdown)}</span>
        </motion.div>
      )}

      {/* Helper text */}
      {!error && !showExpiration && (
        <p className="text-[#2E2E2E]/60 text-center" style={{ fontSize: '0.875rem' }}>
          Ingresá solo letras (A-Z) y números (0-9)
        </p>
      )}
    </div>
  );
}
