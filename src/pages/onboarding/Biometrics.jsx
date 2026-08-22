import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Fingerprint, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export function Biometrics() {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(false);

  function handleEnable() {
    // Simulate biometric activation (actual implementation would use WebAuthn or device APIs)
    setIsEnabled(true);
    toast.success("Biometrics enabled successfully!");
    navigate(ROUTES.DASHBOARD);
  }

  function handleSkip() {
    toast.info("You can enable biometrics later from settings.");
    navigate(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-brand-100 text-brand-600 mb-6">
        <Fingerprint className="size-12" />
      </div>
      <h1 className="text-2xl font-extrabold text-text-primary">Enable Biometrics</h1>
      <p className="mt-3 max-w-xs text-sm text-text-secondary">
        Use your fingerprint to login quickly and securely.
      </p>

      <div className="mt-10 space-y-3 w-full max-w-sm">
        <Button fullWidth size="lg" onClick={handleEnable}>
          Enable Biometrics
        </Button>
        <Button fullWidth size="lg" variant="outline" onClick={handleSkip}>
          Skip for now
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-text-muted">
        <Shield className="size-4" />
        <span>Your biometric data stays on your device</span>
      </div>
    </div>
  );
}