import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/forms/OtpInput";
import { resetPassword } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

export function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-text-primary">Reset Password</h1>
      <p className="mt-1 text-sm text-text-secondary">Enter the OTP sent to your email and set a new password.</p>

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