import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/forms/OtpInput";
import { setTransactionPin } from "@/services/user";
import { ROUTES } from "@/constants/routes";

export function CreatePin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState("create"); // "create" | "confirm"
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue(e) {
    if (e) e.preventDefault(); // Prevent accidental form triggers

    // STEP 1: CREATE STAGE
    if (stage === "create") {
      if (pin.length < 4) {
        toast.error("Please enter a 4-digit PIN");
        return;
      }
      setStage("confirm");
      return;
    }

    // STEP 2: CONFIRM STAGE
    if (stage === "confirm") {
      if (confirmPin.length < 4) {
        toast.error("Please confirm your 4-digit PIN");
        return;
      }

      if (confirmPin !== pin) {
        toast.error("PINs don't match — try again");
        setPin("");
        setConfirmPin("");
        setStage("create");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await setTransactionPin({ pin });

        if (res?.success) {
          toast.success(res.message || "PIN set successfully!");
          navigate(ROUTES.DASHBOARD);
        } else {
          toast.error(res?.message || "Could not set PIN");
        }
      } catch (error) {
        console.error("❌ Catch Block Error:", error);
        toast.error(error?.data?.message || error?.message || "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const value = stage === "create" ? pin : confirmPin;
  const onChange = stage === "create" ? setPin : setConfirmPin;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Step 3 of 3</p>
      <h1 className="mt-1 text-2xl font-extrabold text-text-primary">
        {stage === "create" ? "Create your PIN" : "Confirm your PIN"}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        You'll use this 4-digit PIN to authorize transactions.
      </p>

      {/* Unique key forces OtpInput to reset visually when stage changes */}
      <div className="mt-10">
        <OtpInput key={stage} length={4} value={value} onChange={onChange} />
      </div>

      <Button
        type="button"
        fullWidth
        size="lg"
        className="mt-10"
        disabled={value.length < 4 || isSubmitting}
        isLoading={isSubmitting}
        onClick={handleContinue}
      >
        {stage === "create" ? "Continue" : "Finish Setup"}
      </Button>
    </div>
  );
}