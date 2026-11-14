import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CreditCard, UploadCloud, ShieldCheck, Check } from "lucide-react";
import logo from "@/assets/logo.png";
import { uploadKycDocument, updatePersonalInfo } from "@/services/user";
import { ROUTES } from "@/constants/routes";

export function KycUpload() {
  const navigate = useNavigate();

  // Personal Info Extras (Backend `UpdatePersonalInfo` sync)
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [occupation, setOccupation] = useState("");
  const [monthlySavingsCommitment, setMonthlySavingsCommitment] = useState(5000);

  // KYC Fields (Backend `KYCUpload` sync)
  const [docType, setDocType] = useState("nin");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [idFile, setIdFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idFile) {
      toast.error("Please upload an identification document");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Send extra personal profile details in background
      if (address || dateOfBirth || gender || stateOfOrigin || occupation) {
        await updatePersonalInfo({
          ...(address && { address }),
          ...(dateOfBirth && { dateOfBirth }),
          ...(gender && { gender }),
          ...(stateOfOrigin && { stateOfOrigin }),
          ...(occupation && { occupation }),
          ...(monthlySavingsCommitment && { monthlySavingsCommitment: Number(monthlySavingsCommitment) }),
        });
      }

      // 2. Upload Document via FormData
      const formData = new FormData();
      formData.append("documentType", docType);
      formData.append("file", idFile);
      if (bvn) formData.append("bvn", bvn);
      if (nin) formData.append("nin", nin);

      const res = await uploadKycDocument(formData);

      if (res?.success) {
        toast.success("KYC Uploaded successfully!");
        localStorage.removeItem("user_email");
        navigate(ROUTES.ONBOARDING_CREATE_PIN || "/onboarding/create-pin", { replace: true });
      }
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || err?.data?.message || err?.message || "Failed to submit KYC";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] flex flex-col items-center pb-10">
      <div className="w-full bg-[#3B62EC] rounded-b-[36px] pt-10 pb-24 px-4 flex flex-col items-center text-white relative shadow-md">
        <img src={logo} alt="SocketMonnie" className="h-11 w-auto object-contain mb-4" />
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">Create an account</h1>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-white rounded-2xl px-3 py-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between relative">
            <div className="absolute top-[18px] left-[12%] right-[12%] h-[2px] bg-[#D9DEE8] z-0" />

            {[
              { label: "Personal", num: 1, state: "done" },
              { label: "KYC Verification", num: 2, state: "current" },
              { label: "Review", num: 3, state: "pending" },
              { label: "Completed", num: 4, state: "pending" },
            ].map((step) => (
              <div key={step.label} className="relative z-10 flex flex-col items-center flex-1 px-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.state === "pending"
                      ? "bg-[#E9ECF2] text-[#7C8597]"
                      : "bg-[#3B62EC] text-white"
                  }`}
                >
                  {step.state === "done" ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`text-[10px] leading-tight mt-2 text-center whitespace-nowrap ${
                    step.state === "pending" ? "text-[#9AA3B2] font-medium" : "text-[#1F2937] font-semibold"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 pt-20 flex-1 flex flex-col">

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Background Profile Details */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-900">Personal Information</h4>

              <input
                type="text"
                placeholder="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8F9FB] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3B62EC]"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-3 bg-[#F8F9FB] border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-[#3B62EC]"
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-3 bg-[#F8F9FB] border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-[#3B62EC]"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="State of Origin"
                  value={stateOfOrigin}
                  onChange={(e) => setStateOfOrigin(e.target.value)}
                  className="w-full px-3 py-3 bg-[#F8F9FB] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3B62EC]"
                />
                <input
                  type="text"
                  placeholder="Occupation"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-3 bg-[#F8F9FB] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3B62EC]"
                />
              </div>
            </div>

            {/* Document Selection */}
            <div className="bg-white p-4 rounded-2xl bordern border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-900 text-center">Identity Verification</p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "nin", label: "National ID" },
                  { id: "drivers_license", label: "Driver's License" },
                  { id: "voters_card", label: "Voter's Card" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDocType(type.id)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      docType === type.id
                        ? "border-[#3B62EC] bg-blue-50 text-[#3B62EC]"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="BVN (11 digits) Optional"
                value={bvn}
                onChange={(e) => setBvn(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3B62EC]"
              />
              <input
                type="text"
                placeholder="NIN (11 digits)"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#3B62EC]"
              />
            </div>

            <label className="flex flex-col items-center justify-center p-6 bg-[#EBF0FF] border border-dashed border-[#3B62EC] rounded-2xl cursor-pointer">
              <UploadCloud className="w-8 h-8 text-[#3B62EC] mb-1" />
              <span className="text-xs font-bold text-gray-900">
                {idFile ? idFile.name : "Upload Document Image/PDF"}
              </span>
              <span className="text-[10px] text-gray-500">Max size 5MB</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#3B62EC] text-white font-bold rounded-2xl shadow-md hover:bg-[#3052D1] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Finish Onboarding"}
            </button>
          </form>

      </div>
    </div>
  );
}