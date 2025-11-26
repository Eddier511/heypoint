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
      className={`flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 ${className}`}
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Clock Icon - Outline style, discreet */}
      <div className="flex-shrink-0">
        <Clock 
          className="w-5 h-5 text-[#4A4A4A]" 
          strokeWidth={1.5}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <p 
          className="text-[#4A4A4A] mb-1"
          style={{ fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 }}
        >
          Tus productos están reservados mientras completás el pago.
        </p>
        
        {/* Timer Display */}
        <div className="flex items-center gap-2">
          <span 
            className="text-[#6B6B6B]"
            style={{ fontSize: '0.75rem', fontWeight: 400 }}
          >
            Tiempo restante:
          </span>
          <span 
            className={`font-mono ${timeLeft < 300 ? 'text-[#FF6B00]' : 'text-[#4A4A4A]'}`}
            style={{ fontSize: '0.875rem', fontWeight: 600 }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Optional: Subtle pulse animation when time is low */}
      {timeLeft < 300 && timeLeft > 0 && (
        <div className="flex-shrink-0">
          <div 
            className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse"
            style={{ animationDuration: '2s' }}
          />
        </div>
      )}
    </div>
  );
}
