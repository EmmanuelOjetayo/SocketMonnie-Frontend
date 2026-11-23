import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/forms/OtpInput";
import { resendOtp, verifyOtp } from "@/services/auth";
import { uploadKycDocument, uploadProfilePicture } from "@/services/user";
import { normalizeUser } from "@/utils/userProfile";
import { takePendingSelfie } from "@/utils/pendingSelfie";
import { setPendingKyc, takePendingKyc } from "@/utils/pendingKyc";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

export function VerifyOtp() {
  const { authenticate, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const destination =
    location.state?.destination || localStorage.getItem("user_email") || "your email";

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify() {
    if (destination === "your email") {
      toast.error("We couldn't find your email address. Please go back and register again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await verifyOtp({
        email: destination,
        otp: code,
      });

      // Authenticate — httpOnly cookie is set by backend
      authenticate(response.data.user);
      toast.success(response.message || "Account verified!");

      // Upload the selfie collected at registration now that the auth
      // cookie exists. IndexedDB keeps it across refresh — never a blob
      // URL, never a fake success. Failure never blocks onboarding.
      const pendingSelfie = await takePendingSelfie();
      if (pendingSelfie) {
        const formData = new FormData();
        formData.append("file", pendingSelfie);
        try {
          const picRes = await uploadProfilePicture(formData);
          const avatarUrl = picRes?.data?.avatarUrl || null;
          if (avatarUrl && setUser) {
            setUser((prev) => (prev ? normalizeUser({ ...prev, avatarUrl }) : prev));
          }
          toast.success("Profile picture uploaded.");
        } catch (picErr) {
          console.error("Profile picture upload failed:", picErr);
          toast("Profile picture could not be uploaded — you can try again later.");
        }
      }

      // Submit the KYC document captured in Register. The auth cookie now
      // exists, so the working protected /user/kyc endpoint accepts it.
      // A failed upload keeps the payload for retry but never blocks PIN setup.
      const pendingKyc = await takePendingKyc();
      if (pendingKyc?.file) {
        const kycFormData = new FormData();
        kycFormData.append("documentType", pendingKyc.documentType || "nin");
        kycFormData.append("file", pendingKyc.file);
        kycFormData.append("nin", pendingKyc.nin || "");

        try {
          const kycRes = await uploadKycDocument(kycFormData);
          if (kycRes?.success === false) {
            throw new Error(kycRes?.message || "KYC upload failed");
          }
          toast.success("Identity document uploaded.");
        } catch (kycErr) {
          console.error("KYC upload failed:", kycErr);
          try {
            await setPendingKyc(pendingKyc);
          } catch (restoreErr) {
            console.error("Could not retain KYC for retry:", restoreErr);
          }
          toast.error("Identity document could not be uploaded — you can try again later.");
        }
      }

      // OTP is complete and the single KYC step has been submitted (or
      // reported). Go straight to PIN setup — no second KYC screen.
      localStorage.removeItem("user_email");
      navigate(ROUTES.ONBOARDING_CREATE_PIN || "/onboarding/create-pin", { replace: true });
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Invalid or expired OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (destination === "your email") {
      toast.error("We couldn't find your email address. Please go back and register again.");
      return;
    }
    setIsResending(true);
    try {
      const res = await resendOtp({ email: destination });
      setCode("");
      toast.success(res?.message || "A new verification code has been sent. Please check your inbox or spam/junk folder.");
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Could not resend OTP. Please try again.");
    } finally {
      setIsResending(false);
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
              <span className="text-[10px] font-semibold text-gray-500 mt-2">Create PIN</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 pt-16 flex-1 flex flex-col items-center justify-center">
        <p className="text-center text-sm font-semibold text-gray-700">
          Enter the code sent to <span className="text-[#3B62EC]">{destination}</span>
        </p>
        <p className="mt-2 text-center text-xs font-medium text-red-700">
          If you don't see the code in your inbox, please check your spam/junk folder.
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
          disabled={isResending || isSubmitting}
          className="mt-4 w-full text-center text-xs font-semibold text-[#3B62EC] hover:underline disabled:opacity-60"
        >
          {isResending ? "Resending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}