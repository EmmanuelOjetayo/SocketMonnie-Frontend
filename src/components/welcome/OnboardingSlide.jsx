// src/components/welcome/OnboardingSlide.jsx
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import logo from "@/assets/logo.png";

export function OnboardingSlide({
  title,
  description,
  icon: Icon,
  image,
  iconBgClassName = "bg-brand-500",
  currentStep = 0,
  totalSteps = 1,
  onNext,
  onSkip,
  showSkip = true,
  nextLabel = "Next",
  className,
}) {
  return (
    <div className={cn("flex min-h-screen flex-col px-6 py-8", className)}>
      {/* Logo + Skip row */}
      <div className="flex items-center justify-between">
        <img src={logo} alt="Socket Moni" className="h-8 w-auto" />
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-semibold text-text-primary"
          >
            Skip
          </button>
        )}
      </div>

      {/* Hero illustration card */}
      <div
        className={cn(
          "mt-6 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-card",
          iconBgClassName
        )}
      >
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          Icon && <Icon className="size-20 text-white/90" strokeWidth={1.5} />
        )}
      </div>

      {/* Copy */}
      <div className="mt-10 flex-1 text-center">
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-text-secondary">{description}</p>
      </div>

      {/* Dots + CTA */}
      <div className="w-full space-y-6">
        {totalSteps > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 rounded-pill transition-all",
                  i === currentStep ? "w-6 bg-brand-600" : "w-2 bg-border"
                )}
              />
            ))}
          </div>
        )}
        <Button fullWidth size="lg" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}