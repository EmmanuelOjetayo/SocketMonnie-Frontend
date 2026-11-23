import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/forms/OtpInput";
import { forgotPassword, resetPassword } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { useResendCooldown } from "@/hooks/useResendCooldown";

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { remaining, isCoolingDown, startCooldown } = useResendCooldown();

  // The reset OTP was sent by the previous screen.
  useEffect(() => {
    startCooldown();
  }, [startCooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (otp.length < 4) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast.success("Password reset successful! Please log in.");
      navigate(ROUTES.LOGIN);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    const trimmedEmail = String(email || "").trim();
    if (!trimmedEmail) {
      toast.error("Please enter your email address to resend the code.");
      return;
    }
    setIsResending(true);
    try {
      const res = await forgotPassword({ email: trimmedEmail });
      if (res?.success === false) {
        toast.error(res?.message || "Could not resend reset code. Please try again.");
      } else {
        setOtp("");
        startCooldown();
        toast.success(res?.message || "A new reset OTP has been sent. Please check your inbox or spam/junk folder.");
      }
    } catch (error) {
      toast.error(error?.data?.message || "Could not resend reset code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-text-primary">Reset Password</h1>
      <p className="mt-1 text-sm text-text-secondary">Enter the OTP sent to your email and set a new password.</p>
      <p className="mt-2 text-xs font-medium text-red-700">If you don't see the code in your inbox, please check your spam/junk folder.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">OTP Code</label>
          <OtpInput length={4} value={otp} onChange={setOtp} />
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isSubmitting || isCoolingDown}
            className="mt-2 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60"
          >
            {isResending
              ? "Resending..."
              : isCoolingDown
                ? `Resend code in ${remaining}s`
                : "Resend code"}
          </button>
        </div>
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}