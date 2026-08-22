import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Phone, Gift, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { register } from "@/services/auth";
import { ROUTES } from "@/constants/routes";

export function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Validation Rules
  const checks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error("Please accept the Terms and Privacy Policy to continue");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    // Exact backend payload matching `signUpSchema`
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      referralCode: formData.referralCode,
      password: formData.password,
    };

    try {
      const response = await register(payload);
      toast.success(response?.message || "Account created! OTP sent to email.");

      // Save email locally for OTP page
      localStorage.setItem("user_email", formData.email);

      // Jump directly to OTP verification route
      navigate(ROUTES.VERIFY_OTP || "/verify-otp", {
        state: { destination: formData.email },
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
      {/* Header Banner */}
      <div className="w-full bg-[#3B62EC] rounded-b-[40px] pt-10 pb-20 px-4 flex flex-col items-center justify-center text-white relative shadow-md">
        <img src={logo} alt="Socket Moniee" className="h-10 w-auto object-contain mb-3" />
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>

        {/* 3-Step Stepper Header */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-4 left-8 right-8 h-[2px] bg-gray-200 z-0" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-[#3B62EC] text-white font-bold">
                1
              </div>
              <span className="text-[10px] font-bold text-gray-900 mt-2">Registration</span>
            </div>

            <div className="relative z-10 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-500 border border-gray-200 font-bold">
                2
              </div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">OTP Verify</span>
            </div>

            <div className="relative z-10 flex flex-col items-center opacity-40">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs bg-gray-100 text-gray-500 border border-gray-200 font-bold">
                3
              </div>
              <span className="text-[10px] font-semibold text-gray-500 mt-2">KYC Setup</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-md px-6 pt-16 flex-1 flex flex-col">
        <p className="text-center text-xs font-semibold text-gray-600 mb-6">
          Fill in your details and password to register your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
            />
          </div>

          {/* Phone */}
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
            />
          </div>

          {/* Referral Code */}
          <div className="relative">
            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="referralCode"
              placeholder="Referral Code (Compulsory)"
              required
              value={formData.referralCode}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B62EC]" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create Password"
                required
                value={formData.password}
                onChange={handleChange}
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

          {/* Password Indicator */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className={`h-1 flex-1 rounded-full ${checks.length ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.uppercase ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.special ? "bg-emerald-500" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full ${checks.number ? "bg-emerald-500" : "bg-gray-200"}`} />
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1">
              <p className={`text-[11px] flex items-center gap-1 ${checks.length ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 8+ characters
              </p>
              <p className={`text-[11px] flex items-center gap-1 ${checks.uppercase ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 1 Uppercase (A-Z)
              </p>
              <p className={`text-[11px] flex items-center gap-1 ${checks.special ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 1 Special (!@#$)
              </p>
              <p className={`text-[11px] flex items-center gap-1 ${checks.number ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> 1 Number (0-9)
              </p>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-gray-900 mb-1 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B62EC]" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
              />
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Passwords match</p>
            )}
          </div>

          {/* Declaration */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-900">Declaration</h4>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="rounded text-[#3B62EC] focus:ring-0"
              />
              I agree to Socket Moniee's <span className="text-[#3B62EC] font-semibold">Terms & Condition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={handleChange}
                className="rounded text-[#3B62EC] font-semibold"
              />
              I agree to Socket Moniee's <span className="text-[#3B62EC] font-semibold">Privacy Policy</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Creating Account..." : "Create Account & Verify OTP"}
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