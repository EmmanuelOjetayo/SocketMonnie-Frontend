import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Gift,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Landmark,
  Calendar,
  Users,
  FileText,
  Send,
  IdCard,
  Car,
  FileCheck,
  CreditCard,
  UploadCloud,
  Fingerprint,
  MapPin,
  Briefcase,
  Wallet,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { register } from "@/services/auth";
import { ROUTES } from "@/constants/routes";
import { setPendingSelfie } from "@/utils/pendingSelfie";
import { setPendingKyc } from "@/utils/pendingKyc";
import { isEligibleDob, getMaxDob } from "@/utils/ageValidation";

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "KYC Verification", icon: FileText },
  { label: "Security", icon: ShieldCheck },
  { label: "Completed", icon: Send },
];

const ID_TYPES = [
  { value: "national_id", label: "National ID", icon: IdCard },
  { value: "drivers_license", label: "Driver's License", icon: Car },
  { value: "voters_card", label: "Voter's Card", icon: FileCheck },
];

// The prototype calls this "National ID", but the KYC API validates NIN as
// the canonical document type. Translate once at the handoff boundary.
const KYC_DOCUMENT_TYPE = {
  national_id: "nin",
  drivers_license: "drivers_license",
  voters_card: "voters_card",
};

export function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Auto-fill referral code from a shared link, e.g. ?ref=CODE or
  // ?referralCode=CODE. Still editable afterwards.
  const referralFromUrl =
    searchParams.get("ref") || searchParams.get("referralCode") || "";

  const [step, setStep] = useState(0); // 0 = Personal Info, 1 = KYC Verification, 2 = Security

  // Latest permissible date of birth for an 18+ applicant — current date minus
  // 18 years (month/day aware; someone who turns 18 today is eligible).
  const maxDob = useMemo(() => getMaxDob(), []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referralCode: referralFromUrl,
    // Residential / KYC information captured here (single source of truth for
    // the initial registration step) and persisted via the register payload.
    address: "",
    dob: "",
    gender: "",
    stateOfOrigin: "",
    occupation: "",
    monthlySavingsCommitment: 5000,
    idType: "national_id",
    nin: "",
    biometricsEnabled: false,
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    privacyAccepted: false,
  });

  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

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
  const strengthScore = Object.values(checks).filter(Boolean).length;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // NIN is digits-only and capped at the backend's 11-character limit.
    if (name === "nin") {
      const digits = String(value).replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, nin: digits }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files?.[0] || null;
    setter(file);
  };

  const validatePersonalInfo = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.referralCode) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (!formData.dob) {
      toast.error("Please enter your date of birth");
      return false;
    }
    // Age gate: applicants must be at least 18 years old. Enforced here for UX
    // and independently by the backend before account creation.
    if (!isEligibleDob(formData.dob)) {
      toast.error("You must be at least 18 years old to create a SocketMonnie account.");
      return false;
    }
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      toast.error("Please accept the Terms and Privacy Policy to continue");
      return false;
    }
    return true;
  };

  const validateKyc = () => {
    if (!/^\d{11}$/.test(formData.nin)) {
      toast.error("Please enter a valid 11-digit NIN");
      return false;
    }
    if (!idFile) {
      toast.error("Please upload the front of your ID card");
      return false;
    }
    if (!selfieFile) {
      toast.error("Selfie upload is compulsory");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 0 && !validatePersonalInfo()) return;
    if (step === 1 && !validateKyc()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 2));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

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
      termsAccepted: formData.termsAccepted === true,
      privacyAccepted: formData.privacyAccepted === true,
      dateOfBirth: formData.dob,
      gender: formData.gender || undefined,
      address: formData.address || undefined,
      stateOfOrigin: formData.stateOfOrigin || undefined,
      occupation: formData.occupation || undefined,
      monthlySavingsCommitment:
        Number(formData.monthlySavingsCommitment) >= 5000
          ? Number(formData.monthlySavingsCommitment)
          : undefined,
    };

    try {
      const response = await register(payload);
      toast.success(response?.message || "Account created! OTP sent to your email. Please check your inbox or spam/junk folder if you don't see it.");

      // Stash the selfie for upload right after OTP verification (auth
      // cookie only exists after VerifyOtp). IndexedDB persists the File
      // across refresh — never persisted as a blob URL.
      if (selfieFile) {
        try {
          await setPendingSelfie(selfieFile);
        } catch (selfieErr) {
          console.error("Could not stash selfie:", selfieErr);
        }
      }

      // Stash the single KYC document collected in this step. It is submitted
      // to the protected /user/kyc endpoint immediately after OTP verification;
      // it must NOT be collected again on a second onboarding screen.
      if (idFile && formData.nin) {
        try {
          await setPendingKyc({
            documentType: KYC_DOCUMENT_TYPE[formData.idType] || "nin",
            nin: formData.nin,
            file: idFile,
          });
        } catch (kycErr) {
          console.error("Could not stash KYC document:", kycErr);
        }
      }

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
    <div 
  className="w-full rounded-b-[40px] pt-3 pb-20 px-4 flex flex-col items-center justify-center text-white relative shadow-md"
  style={{ background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)" }}
><div className="bg-white/90 backdrop-blur-md p-2.5 rounded-2xl shadow-lg mb-3 flex items-center justify-center">
      <img src={logo} alt="Socket Moniee" className="h-10 w-auto object-contain" />
    </div><h1 className="text-2xl font-bold tracking-tight">Create an account</h1>

        {/* 4-Step Stepper Header */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative px-1 md:px-2">
            <div className="absolute top-4 left-6 right-6 md:left-8 md:right-8 h-[2px] bg-gray-200 z-0" />

            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isReached = idx <= step;
              return (
                <div key={s.label} className={`relative z-10 flex flex-col items-center min-w-0 flex-1 ${isReached ? "" : "opacity-40"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isReached
                        ? "bg-[#3B62EC] text-white"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[9px] md:text-[10px] mt-1.5 md:mt-2 whitespace-nowrap text-center leading-tight ${idx === step ? "font-bold text-gray-900" : "font-semibold text-gray-500"}`}>
                    {idx + 1}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-md px-6 pt-16 flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ───────────────────── STEP 1: PERSONAL INFO ───────────────────── */}
          {step === 0 && (
            <>
              <p className="text-center text-xs font-semibold text-gray-600 mb-2">
                Join over 5,000 members saving and growing together
              </p>

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
                {referralFromUrl && (
                  <p className="mt-1 pl-12 text-xs text-emerald-600">Referral code applied from your invitation link.</p>
                )}
              </div>

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

              <div className="relative">
                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  placeholder="Residential Address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="dob"
                  placeholder="Enter Date of Birth"
                  max={maxDob}
                  required
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:border-[#3B62EC]"
                />
              </div>

              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:border-[#3B62EC] appearance-none"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="stateOfOrigin"
                  placeholder="State of Origin"
                  value={formData.stateOfOrigin}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                />
              </div>

              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="occupation"
                  placeholder="Occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                />
              </div>

              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="monthlySavingsCommitment"
                  min={5000}
                  value={formData.monthlySavingsCommitment}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                />
              </div>

              <div className="bg-[#EEF1FD] p-4 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3B62EC] flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                  \
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Why we need this information</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    This information helps us verify your identity and provide you with the best financial services.
                  </p>
                </div>
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
                  I agree to Socket Moniee's{" "}
                  <span className="text-[#3B62EC] font-semibold">
                    <Link to={ROUTES.TERMS} state={{ from: location.pathname + location.search + location.hash }} className="text-[#3B62EC] font-semibold">Terms &amp; Condition</Link>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    name="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onChange={handleChange}
                    className="rounded text-[#3B62EC] font-semibold"
                  />
                  I agree to Socket Moniee's{" "}
                  <span className="text-[#3B62EC] font-semibold">
                    <Link to={ROUTES.PRIVACY} state={{ from: location.pathname + location.search + location.hash }} className="text-[#3B62EC] font-semibold">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={goNext}
                className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer"
              >
                Continue
              </button>

              <p className="text-center text-xs text-gray-600 pt-2">
                Already have an account?{" "}
                <Link to={ROUTES.LOGIN || "/login"} className="text-[#3B62EC] font-bold">
                  Log in
                </Link>
              </p>
            </>
          )}

          {/* ───────────────────── STEP 2: KYC VERIFICATION ───────────────────── */}
          {step === 1 && (
            <>
              <p className="text-center text-xs font-semibold text-gray-600 mb-2">
                Verify your identity to secure your account and unlock savings, loans, and other cooperative benefits
              </p>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-900">
                  Identification Document
                  <span className="block font-normal text-gray-500 mt-0.5">Upload a valid government issued ID card</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  {ID_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.idType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, idType: type.value }))}
                        className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-[11px] font-semibold transition ${
                          isSelected
                            ? "border-[#3B62EC] bg-[#EEF1FD] text-gray-900"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                            isSelected ? "border-[#3B62EC] bg-[#3B62EC]" : "border-gray-300"
                          }`}
                        />
                        <Icon className={`w-5 h-5 ${isSelected ? "text-[#3B62EC]" : "text-gray-400"}`} />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="nin"
                  placeholder="NIN Number"
                  maxLength={11}
                  value={formData.nin}
                  onChange={handleChange}
                  className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                />
                <span
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${
                    formData.nin.length === 11 ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                  }`}
                />
              </div>

              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#3B62EC]/40 bg-[#EEF1FD] p-6 text-center">
                <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleFileChange(setIdFile)} />
                <UploadCloud className="w-6 h-6 mx-auto text-[#3B62EC]" />
                <p className="text-xs font-bold text-gray-900 mt-2">
                  {idFile ? idFile.name : "Upload Front of ID Card"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">PNG, JPG or PDF (Max. 5MB)</p>
              </label>

              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#3B62EC]/40 bg-[#EEF1FD] p-6 text-center">
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange(setSelfieFile)} />
                <UploadCloud className="w-6 h-6 mx-auto text-[#3B62EC]" />
                <p className="text-xs font-bold text-gray-900 mt-2">
                  {selfieFile ? selfieFile.name : "Snap and Upload the selfie of yourself"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">(Compulsory)</p>
              </label>

              <div className="bg-[#EEF1FD] p-4 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3B62EC] flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Your KYC helps us keeps Socket Moniee safe</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    Your information is secure with us and will never be shared
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={goNext}
                className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer"
              >
                Continue
              </button>

              <button
                type="button"
                onClick={goBack}
                className="w-full text-center text-xs font-bold text-gray-500 pt-1"
              >
                Back
              </button>

              <p className="text-center text-xs text-gray-600 pt-1">
                Already have an account?{" "}
                <Link to={ROUTES.LOGIN || "/login"} className="text-[#3B62EC] font-bold">
                  Log in
                </Link>
              </p>
            </>
          )}

          {/* ───────────────────── STEP 3: SECURITY ───────────────────── */}
          {step === 2 && (
            <>
              <p className="text-center text-xs font-semibold text-gray-600 mb-2">
                Set up a strong password and security preferences to keep your account safe
              </p>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-gray-900 mb-1 block">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B62EC]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
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
                {formData.password && (
                  <p className={`text-xs font-semibold ${strengthScore === 4 ? "text-emerald-600" : strengthScore >= 2 ? "text-amber-500" : "text-red-500"}`}>
                    {strengthScore === 4 ? "Strong password" : strengthScore >= 2 ? "Medium password" : "Weak password"}
                  </p>
                )}
                <div className="flex gap-2">
                  <div className={`h-1 flex-1 rounded-full ${checks.length ? "bg-emerald-500" : "bg-gray-200"}`} />
                  <div className={`h-1 flex-1 rounded-full ${checks.uppercase ? "bg-emerald-500" : "bg-gray-200"}`} />
                  <div className={`h-1 flex-1 rounded-full ${checks.special ? "bg-emerald-500" : "bg-gray-200"}`} />
                  <div className={`h-1 flex-1 rounded-full ${checks.number ? "bg-emerald-500" : "bg-gray-200"}`} />
                </div>

                <div className="grid grid-cols-2 gap-1 pt-1">
                  <p className={`text-[11px] flex items-center gap-1 ${checks.length ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> At least 8 characters
                  </p>
                  <p className={`text-[11px] flex items-center gap-1 ${checks.uppercase ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> One uppercase letter (A-Z)
                  </p>
                  <p className={`text-[11px] flex items-center gap-1 ${checks.special ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> One special character (!@#$%)
                  </p>
                  <p className={`text-[11px] flex items-center gap-1 ${checks.number ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> One number (0-9)
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
                    placeholder="Password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3B62EC]"
                  />
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">Password match</p>
                )}
              </div>

              {/* Biometrics (UI only) */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Enable Biometrics (Optional)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Use your fingerprint to login quickly and securely</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, biometricsEnabled: !prev.biometricsEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    formData.biometricsEnabled ? "bg-[#3B62EC]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      formData.biometricsEnabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="bg-[#EEF1FD] p-4 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3B62EC] flex items-center justify-center text-white shrink-0">
                  <ShieldAlert className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-900">If you don't see your OTP in your inbox, please check your spam/junk folder.</p>
                  <p className="text-xs font-bold text-gray-900 mt-1">Your security is our priority</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Your transactions and data are secure</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating Account..." : "Create Account & Verify OTP"}
              </button>

              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="w-full text-center text-xs font-bold text-gray-500 pt-1"
              >
                Back
              </button>

              <p className="text-center text-xs text-gray-600 pt-1">
                Already have an account?{" "}
                <Link to={ROUTES.LOGIN || "/login"} className="text-[#3B62EC] font-bold">
                  Log in
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}