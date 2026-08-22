// src/components/ui/Stepper.jsx
import { User, FileText, ShieldCheck, Send } from "lucide-react";
import { cn } from "@/utils/cn";

const STEPS = [
  { key: "personal-info", label: "Personal Info", icon: User },
  { key: "kyc", label: "KYC Verification", icon: FileText },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "completed", label: "Completed", icon: Send },
];

/**
 * 4-stage onboarding stepper (Personal Info -> KYC Verification -> Security -> Completed).
 * `current` is the 0-based index of the active step; steps before it render as done.
 */
export function Stepper({ current = 0, className }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < current;
          const isActive = i === current;
          const isFilled = isDone || isActive;
          const Icon = step.icon;

          return (
            <div key={step.key} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isFilled ? "border-white bg-white text-brand-600" : "border-white/50 bg-transparent text-white/70"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-[10px] font-semibold",
                    isFilled ? "text-white" : "text-white/60"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1 h-0.5 flex-1 -translate-y-3", isDone ? "bg-white" : "bg-white/30")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}