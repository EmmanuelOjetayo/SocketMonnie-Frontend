import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/forms/OtpInput";
import { verifyOtp } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

export function VerifyOtp() {
  const { authenticate } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const destination =
    location.state?.destination || localStorage.getItem("user_email") || "your email";

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify() {
    setIsSubmitting(true);
    try {
      const response = await verifyOtp({
        email: destination,
        otp: code,
      });

      // Authenticate with JWT returned from verification backend
      authenticate(response.data.token, response.data.user);
      toast.success(response.message || "Account verified!");

      // Navigate straight to KYC
      navigate(ROUTES.ONBOARDING_KYC || "/onboarding/kyc");
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Invalid or expired OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      toast.success("OTP resent to your email.");
    } catch {
      toast.error("Could not resend OTP.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center pb-10">
      <div className="w-full bg-[#3B62EC] rounded-b-[40px] pt-10 pb-20 px-4 flex flex-col items-center justify-center text-white relative shadow-md">
        <img src={logo} alt="Socket Moniee" className="h-10 w-auto object-contain mb-3" />
        <h1 className="text-2xl font-bold tracking-tight">Verify Your Account</h1>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-4 left-8 right-8 h-[2px] bg-gray-200 z-0" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[#3B62EC] text-white font-bold">✓</div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">Registration</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[#3B62EC] text-white font-bold">2</div>
              <span className="text-[10px] font-bold text-gray-900 mt-2">OTP Verify</span>
            </div>

            <div className="relative z-10 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-500 border border-gray-200 font-bold">3</div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">KYC Setup</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 pt-16 flex-1 flex flex-col items-center justify-center">
        <p className="text-center text-sm font-semibold text-gray-700">
          Enter the code sent to <span className="text-[#3B62EC]">{destination}</span>
        </p>

        <div className="mt-8 mb-6 w-full flex justify-center">
          <OtpInput length={4} value={code} onChange={setCode} />
        </div>

        <Button
          fullWidth
          size="lg"
          className="mt-4 bg-[#3B62EC] hover:bg-[#3052D1] text-white font-bold py-4 rounded-2xl"
          disabled={code.length < 4}
          isLoading={isSubmitting}
          onClick={handleVerify}
        >
          Verify & Continue
        </Button>

        <button
          type="button"
          onClick={handleResend}
          className="mt-4 w-full text-center text-xs font-semibold text-[#3B62EC] hover:underline"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}