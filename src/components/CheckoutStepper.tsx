import { Check, CreditCard, Package, ShoppingBag } from "lucide-react";
import { Fragment } from "react";

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { number: 1, label: "Carrito", icon: ShoppingBag },
  { number: 2, label: "Pago", icon: CreditCard },
  { number: 3, label: "Confirmación", icon: Package },
] as const;

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <nav
      className="mx-auto w-full max-w-3xl px-1"
      aria-label="Progreso de compra"
    >
      <ol className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const Icon = step.icon;

          return (
            <Fragment key={step.number}>
              <li
                className="flex min-w-0 flex-col items-center text-center"
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={[
                    "mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors sm:h-12 sm:w-12",
                    isCompleted || isActive
                      ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                      : "border-[#E5E7EB] bg-white text-gray-400",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </div>
                <span
                  className={[
                    "block max-w-full truncate text-[0.72rem] leading-tight sm:text-sm",
                    isCompleted || isActive ? "text-[#FF6B00]" : "text-gray-400",
                  ].join(" ")}
                  style={{ fontWeight: isActive ? 700 : 600 }}
                >
                  {step.label}
                </span>
              </li>

              {index < steps.length - 1 && (
                <li
                  className={[
                    "mt-5 h-0.5 w-8 rounded-full transition-colors sm:mt-6 sm:w-20 md:w-28",
                    currentStep > step.number ? "bg-[#FF6B00]" : "bg-[#E5E7EB]",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
