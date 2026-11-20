import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CreditCard, UploadCloud } from "lucide-react";
import logo from "@/assets/logo.png";
import { uploadKycDocument } from "@/services/user";
import { ROUTES } from "@/constants/routes";

export function KycUpload() {
  const navigate = useNavigate();

  // KYC Fields (Backend `KYCUpload` sync)
  const [docType, setDocType] = useState("nin");
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
      // KYC document submission only — residential / personal information is
      // captured once during the initial registration step (Register) and is
      // persisted there, so it is intentionally NOT re-collected here.
      const formData = new FormData();
      formData.append("documentType", docType);
      formData.append("file", idFile);
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
            {/* KYC document submission only — residential / personal information
                is captured once during the initial registration step and is not
                re-collected here. */}

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

            <div>
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