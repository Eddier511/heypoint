import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ReservationTimerProps {
  initialMinutes?: number;
  className?: string;
}

/**
 * ReservationTimer Component
 * 
 * Displays a discreet, premium reservation timer for web checkout.
 * Shows how long products are reserved during payment flow.
 * 
 * Design principles:
 * - Non-alarming, informative tone
 * - Clean, minimal design
 * - Consistent with HeyPoint web design system
 * - Only appears on web (not kiosk)
 * 
 * @param initialMinutes - Minutes for reservation (default: 15)
 * @param className - Optional additional classes
 */
export function ReservationTimer({ 
  initialMinutes = 15,
  className = "" 
}: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // Convert to seconds

  useEffect(() => {
    // Don't start timer if time is 0 or negative
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`flex flex-col items-center gap-3 rounded-2xl border border-[#FFE0C2] bg-white/90 p-4 text-center shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:text-left ${className}`}
      style={{ 
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Clock Icon - Outline style, discreet */}
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#FFF4E6] text-[#FF6B00]">
        <Clock 
          className="h-5 w-5" 
          strokeWidth={2}
        />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <p 
          className="text-[#4A4A4A]"
          style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}
        >
          Tus productos están reservados mientras completás el pago.
        </p>
        
        {/* Timer Display */}
        <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 sm:justify-start">
          <span 
            className="text-[#6B6B6B]"
            style={{ fontSize: '0.8125rem', fontWeight: 500 }}
          >
            Tiempo restante:
          </span>
          <span 
            className={`font-mono ${timeLeft < 300 ? 'text-[#FF6B00]' : 'text-[#1C2335]'}`}
            style={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.1 }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Optional: Subtle pulse animation when time is low */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="hidden flex-shrink-0 sm:block">
          <div 
            className="h-2 w-2 rounded-full bg-[#FF6B00] animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>
      )}
    </div>
  );
}
