import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPassword } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { useResendCooldown } from "@/hooks/useResendCooldown";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { remaining, isCoolingDown, startCooldown } = useResendCooldown();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ email });
      setSent(true);
      startCooldown();
      toast.success(res?.message || "Reset OTP sent to your email. Please check your inbox or spam/junk folder if you don't see it.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not send reset code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ email });
      startCooldown();
      toast.success(res?.message || "A new reset OTP has been sent. Please check your inbox or spam/junk folder.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not resend reset code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-text-primary">Reset your password</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {sent ? "Check your inbox for a reset OTP." : "Enter your email and we'll send you a reset OTP."}
      </p>

      {!sent ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Email Address"
            icon={Mail}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
            Send Reset OTP
          </Button>
          <p className="text-xs font-medium text-text-secondary text-center">
            If you don't see the code in your inbox, please check your spam/junk folder.
          </p>
        </form>
      ) : (
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm font-medium text-red-700">If you don't see the code in your inbox, please check your spam/junk folder.</p>
          <p className="text-sm text-text-secondary">
            Didn't receive the OTP?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting || isCoolingDown}
              className="font-semibold text-brand-600 hover:underline disabled:opacity-60"
            >
              {isSubmitting
                ? "Resending..."
                : isCoolingDown
                  ? `Resend code in ${remaining}s`
                  : "Resend code"}
            </button>
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="block w-full text-sm font-semibold text-text-secondary hover:underline"
          >
            Use a different email
          </button>
          <Link to={ROUTES.RESET_PASSWORD} state={{ email }} className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Enter OTP and reset password
          </Link>
        </div>
      )}
    </div>
  );
}