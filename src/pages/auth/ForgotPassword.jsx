import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPassword } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
      setSent(true);
      toast.success("Reset OTP sent to your email.");
    } catch (error) {
      toast.error(error?.data?.message || "Could not send reset link");
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
        </form>
      ) : (
        <div className="mt-8 text-center">
           <p className="text-xs font-bold text-red-900">Check SPAM for your OTP code</p>
          <p className="text-sm text-text-secondary">
            Didn't receive the OTP?{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-brand-600 hover:underline"
            >
              Try again
            </button>
          </p>
          <Link to={ROUTES.RESET_PASSWORD} className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
            Enter OTP and reset password
          </Link>
        </div>
      )}
    </div>
  );
}