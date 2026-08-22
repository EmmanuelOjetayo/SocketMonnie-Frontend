import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, Fingerprint, ShieldCheck, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { register } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

export function PersonalInfo() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error("Please satisfy all password requirements");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const cached = JSON.parse(localStorage.getItem("onboarding_data") || "{}");
    if (!cached.email || !cached.fullName || !cached.phone || !cached.referralCode) {
      toast.error("Missing personal information. Please complete step 1.");
      navigate(ROUTES.REGISTER || "/register");
      return;
    }

    setIsSubmitting(true);

    // Payload matches signUpSchema backend requirements exactly
    const registerPayload = {
      fullName: cached.fullName,
      email: cached.email,
      phone: cached.phone,
      referralCode: cached.referralCode,
      password: password,
    };

    try {
      const response = await register(registerPayload);
      toast.success(response?.message || "Account created! OTP sent to email.");

      // Save email for OTP page recovery
      localStorage.setItem("user_email", cached.email);

      navigate(ROUTES.VERIFY_OTP || "/verify-otp", {
        state: { destination: cached.email },
      });
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Registration failed";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center pb-10">
      <div className="w-full bg-[#3B62EC] rounded-b-[40px] pt-10 pb-20 px-4 flex flex-col items-center justify-center text-white relative shadow-md">
        <img src={logo} alt="Socket Moniee" className="h-10 w-auto object-contain mb-3" />
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-6 right-6 h-[2px] bg-gray-200 z-0" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[#3B62EC] text-white">✓</div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">1. Personal Info</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[#3B62EC] text-white">2</div>
              <span className="text-[10px] font-bold text-gray-900 mt-2">2. Security</span>
            </div>
            <div className="relative z-10 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-500 border border-gray-200">3</div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">3. OTP Verify</span>
            </div>
            <div className="relative z-10 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-500 border border-gray-200">4</div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">4. KYC</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 pt-16 flex-1 flex flex-col">
        <p className="text-center text-xs font-medium text-gray-600 mb-6 px-2">
          Set up a strong password and security preferences to keep your account safe
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1 block">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B62EC]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <div className={`h-1 flex-1 rounded-full ${checks.length ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.uppercase ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.special ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.number ? "bg-emerald-500" : "bg-gray-200"}`} />
            </div>

            <div className="space-y-1 pt-1">
              <p className={`text-[11px] flex items-center gap-1.5 ${checks.length ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> At least 8 characters
              </p>
              <p className={`text-[11px] flex items-center gap-1.5 ${checks.uppercase ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> One uppercase letter (A-Z)
              </p>
              <p className={`text-[11px] flex items-center gap-1.5 ${checks.special ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> One special character (!@#$%)
              </p>
              <p className={`text-[11px] flex items-center gap-1.5 ${checks.number ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> One number (0-9)
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-900 mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B62EC]" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                required
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
              />
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Passwords match</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-[#3B62EC] rounded-xl">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Enable Biometrics (Optional)</h4>
                <p className="text-[10px] text-gray-500">Use your fingerprint to login quickly</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableBiometrics}
              onChange={(e) => setEnableBiometrics(e.target.checked)}
              className="w-5 h-5 accent-[#3B62EC] cursor-pointer"
            />
          </div>

          <div className="bg-[#EBF0FF] p-4 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-[#3B62EC] rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">Your security is our priority</h4>
              <p className="text-xs text-gray-600 mt-0.5">Your transactions and data are protected</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit & Continue"}
          </button>

          <p className="text-center text-xs text-gray-600 pt-2">
            Already have an account?{" "}
            <Link to={ROUTES.LOGIN || "/login"} className="text-[#3B62EC] font-bold">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}