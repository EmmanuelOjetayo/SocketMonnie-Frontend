import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronRight,
  User,
  Landmark,
  ShieldCheck,
  LogOut,
  X,
  PiggyBank,
  HandCoins,
  Lock,
  UserCheck,
  Handshake,
  Bell,
  Eye,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/utils/format";
import { getSavingsSummary } from "@/services/savings";
import { getActiveLoan } from "@/services/loans";
import {
  updatePersonalInfo,
  updateBankDetails,
  uploadKycDocument,
  setTransactionPin,
} from "@/services/user";
import { ROUTES } from "@/constants/routes";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  // Stats Data
  const { data: savingsData } = useAsync(getSavingsSummary, []);
  const { data: loanData } = useAsync(getActiveLoan, []);

  const totalSaved = savingsData?.summary?.totalSaved || 0;
  const activeLoan = loanData?.loan || loanData;
  const activeLoanAmount = activeLoan?.remainingBalance || 0;

  const firstName = user?.fullName?.split(" ")[0] ?? "Member";
  const regNumber = user?.referralCode || user?._id?.substring(0, 8) || "N/A";
  const greeting = getGreeting();
  const kycStatus = user?.kycStatus || "unverified";

  // --- Form States ---
  // 1. Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: "",
    gender: "",
    address: "",
    stateOfOrigin: "",
    occupation: "",
    monthlySavingsCommitment: 5000,
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // 2. Bank Details
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    bankCode: "058",
    accountName: "",
    accountNumber: "",
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // 3. KYC Upload
  const [kycData, setKycData] = useState({
    documentType: "nin",
    bvn: "",
    nin: "",
  });
  const [kycFile, setKycFile] = useState(null);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);

  // 4. Security / Pin
  const [pin, setPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    if (user) {
      setPersonalInfo({
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        gender: user.gender || "",
        address: user.address || "",
        stateOfOrigin: user.stateOfOrigin || "",
        occupation: user.occupation || "",
        monthlySavingsCommitment: user.monthlySavingsCommitment || 5000,
      });

      if (user.bankDetails) {
        setBankDetails({
          bankName: user.bankDetails.bankName || "",
          bankCode: user.bankDetails.bankCode || "058",
          accountName: user.bankDetails.accountName || "",
          accountNumber: user.bankDetails.accountNumber || "",
        });
      }

      if (user.documentType) {
        setKycData({
          documentType: user.documentType || "nin",
          bvn: user.bvn || "",
          nin: user.nin || "",
        });
      }
    }
  }, [user]);

  // --- API Handlers ---
  async function handleSavePersonalInfo() {
    setIsSavingInfo(true);
    try {
      const payload = {};
      if (personalInfo.dateOfBirth) payload.dateOfBirth = personalInfo.dateOfBirth;
      if (personalInfo.gender) payload.gender = personalInfo.gender;
      if (personalInfo.address) payload.address = personalInfo.address;
      if (personalInfo.stateOfOrigin) payload.stateOfOrigin = personalInfo.stateOfOrigin;
      if (personalInfo.occupation) payload.occupation = personalInfo.occupation;
      if (personalInfo.monthlySavingsCommitment) {
        payload.monthlySavingsCommitment = Number(personalInfo.monthlySavingsCommitment);
      }

      const res = await updatePersonalInfo(payload);
      if (res?.success) {
        toast.success(res.message || "Personal info updated successfully!");
        setActiveModal(null);
      } else {
        toast.error(res?.message || "Failed to update info");
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to update info");
    } finally {
      setIsSavingInfo(false);
    }
  }

  async function handleSaveBankDetails() {
    if (!bankDetails.bankName || !bankDetails.accountName || bankDetails.accountNumber.length !== 10) {
      toast.error("Please enter valid 10-digit account details");
      return;
    }
    setIsSavingBank(true);
    try {
      const res = await updateBankDetails(bankDetails);
      if (res?.success) {
        if (res.data?.user) setUser(res.data.user);
        toast.success(res.message || "Bank details updated successfully!");
        setActiveModal(null);
      } else {
        toast.error(res?.message || "Failed to update bank details");
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to update bank details");
    } finally {
      setIsSavingBank(false);
    }
  }

  async function handleKycUpload() {
    if (!kycFile && !user?.documentUrl) {
      toast.error("Please select a document file to upload");
      return;
    }
    setIsUploadingKyc(true);
    const formData = new FormData();
    if (kycFile) formData.append("file", kycFile);
    formData.append("documentType", kycData.documentType);
    if (kycData.bvn) formData.append("bvn", kycData.bvn);
    if (kycData.nin) formData.append("nin", kycData.nin);

    try {
      const res = await uploadKycDocument(formData);
      if (res?.success) {
        toast.success("KYC Document updated successfully!");
        setActiveModal(null);
      } else {
        toast.error(res?.message || "Failed to update KYC");
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to update document");
    } finally {
      setIsUploadingKyc(false);
    }
  }

  async function handleSetPin() {
    if (pin.length !== 4) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    setIsSavingPin(true);
    try {
      const res = await setTransactionPin({ pin });
      if (res?.success) {
        setUser((currentUser) => ({ ...currentUser, isPinSet: true }));
        toast.success(res.message || "PIN set successfully!");
        setPin("");
        setActiveModal(null);
      } else {
        toast.error(res?.message || "Failed to set PIN");
      }
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to set PIN");
    } finally {
      setIsSavingPin(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN);
    } catch {
      toast.error("Error logging out");
    }
  }

  const MENU_ITEMS = [
    {
      icon: User,
      title: "Personal Information",
      subtitle: "View and update your personal details",
      action: () => setActiveModal("info"),
    },
    {
      icon: Landmark,
      title: "Bank Details",
      subtitle: "Manage your bank account details",
      action: () => setActiveModal("bank"),
    },
    {
      icon: ShieldCheck,
      title: "KYC Verification",
      subtitle: user?.documentUrl ? "View or update document" : "Upload verification documents",
      badge: kycStatus,
      action: () => setActiveModal("kyc"),
    },
    {
      icon: Lock,
      title: "Security & Transaction PIN",
      subtitle: user?.isPinSet ? "Update 4-digit PIN" : "Set 4-digit PIN",
      action: () => setActiveModal("pin"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* BRAND HEADER MATCHING TOPHEADER DESIGN */}
      <header
        className="relative text-white px-5 pt-4 pb-8 rounded-b-[28px] shadow-md"
         style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <h1 className="text-lg font-bold tracking-tight text-white">Profile & Settings</h1>
         </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-full overflow-hidden border-2 border-[#5b76e1] bg-[#1d2d6d] shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={firstName} className="size-full object-cover" />
              ) : (
                <div
                  className="flex size-full items-center justify-center font-bold text-base text-white"
                  style={{ backgroundColor: "#3b5bdb" }}
                >
                  {firstName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-normal text-[#bdc8f3] leading-tight">{greeting}</span>
              <span className="text-base font-bold text-white tracking-wide leading-snug">
                {user?.fullName || firstName}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#bdc8f3]/80 mt-0.5">
                <UserCheck className="size-3 text-[#7c91e7]" />
                <span>Reg Number: {regNumber}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="p-2.5 rounded-full bg-[#1d2d6d]/60 border border-[#3b5bdb]/40 hover:bg-[#3b5bdb]/30 transition-colors"
          >
            <Bell className="size-4 text-white" />
          </button>
        </div>
      </header>

      <div className="px-5 -mt-4 pb-8 space-y-4">
        {/* Horizontal Stats */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          <Card className="min-w-[130px] p-3 text-center rounded-2xl bg-white shadow-sm flex-1 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <PiggyBank className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-gray-500">Total Savings</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{formatNaira(totalSaved)}</p>
          </Card>

          <Card className="min-w-[130px] p-3 text-center rounded-2xl bg-white shadow-sm flex-1 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
              <HandCoins className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-gray-500">Active Loan</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{formatNaira(activeLoanAmount)}</p>
          </Card>

          <Card className="min-w-[130px] p-3 text-center rounded-2xl bg-white shadow-sm flex-1 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium text-gray-500">Referral Code</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{user?.referralCode || "N/A"}</p>
          </Card>
        </div>

        {/* Navigation List Cards */}
        <div className="space-y-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#3b5bdb]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.title}</span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
                          {item.badge.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 flex items-center justify-center gap-2 text-red-600 font-semibold text-sm bg-red-50 hover:bg-red-100 rounded-2xl transition-colors mt-6"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* ==================== EDITABLE MODALS ==================== */}

      {/* 1. PERSONAL INFORMATION MODAL */}
      {activeModal === "info" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <Input label="Full Name" value={user?.fullName || ""} disabled className="bg-gray-100 cursor-not-allowed" />
              <Input label="Email" value={user?.email || ""} disabled className="bg-gray-100 cursor-not-allowed" />
              <Input label="Phone" value={user?.phone || ""} disabled className="bg-gray-100 cursor-not-allowed" />

              <Input
                label="Date of Birth"
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Gender</label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#3b5bdb]"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <Input
                label="Address"
                placeholder="Residential Address"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
              />

              <Input
                label="State of Origin"
                placeholder="e.g. Lagos"
                value={personalInfo.stateOfOrigin}
                onChange={(e) => setPersonalInfo({ ...personalInfo, stateOfOrigin: e.target.value })}
              />

              <Input
                label="Occupation"
                placeholder="e.g. Software Engineer"
                value={personalInfo.occupation}
                onChange={(e) => setPersonalInfo({ ...personalInfo, occupation: e.target.value })}
              />

              <Input
                label="Monthly Savings Commitment (₦)"
                type="number"
                min={5000}
                value={personalInfo.monthlySavingsCommitment}
                onChange={(e) => setPersonalInfo({ ...personalInfo, monthlySavingsCommitment: e.target.value })}
              />
            </div>

            <Button fullWidth isLoading={isSavingInfo} onClick={handleSavePersonalInfo} className="mt-4 rounded-full bg-[#1d2d6d]">
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* 2. BANK DETAILS MODAL */}
      {activeModal === "bank" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <Input
                label="Bank Name"
                placeholder="e.g. GTBank"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              />
              <Input
                label="Account Number"
                placeholder="10-digit Account Number"
                maxLength={10}
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value.replace(/\D/g, "") })}
              />
              <Input
                label="Account Name"
                placeholder="e.g. John Doe"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              />
            </div>

            <Button fullWidth isLoading={isSavingBank} onClick={handleSaveBankDetails} className="mt-4 rounded-full bg-[#1d2d6d]">
              Save Bank Details
            </Button>
          </div>
        </div>
      )}

      {/* 3. KYC UPLOAD / VIEW MODAL */}
      {activeModal === "kyc" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">KYC Verification</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Existing Document Preview Badge */}
            {user?.documentUrl && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#3b5bdb]" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Uploaded Document</p>
                    <p className="text-[10px] text-gray-500 uppercase">{user.documentType || "Verification File"}</p>
                  </div>
                </div>
                <a
                  href={user.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-[#3b5bdb] hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </a>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">Document Type</label>
                <select
                  value={kycData.documentType}
                  onChange={(e) => setKycData({ ...kycData, documentType: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#3b5bdb]"
                >
                  <option value="nin">NIN (National ID)</option>
                  <option value="voters_card">Voter's Card</option>
                  <option value="passport">International Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>

              <Input
                label="BVN (11 Digits)"
                maxLength={11}
                placeholder="Optional"
                value={kycData.bvn}
                onChange={(e) => setKycData({ ...kycData, bvn: e.target.value.replace(/\D/g, "") })}
              />

              <Input
                label="NIN (11 Digits)"
                maxLength={11}
                placeholder="Optional"
                value={kycData.nin}
                onChange={(e) => setKycData({ ...kycData, nin: e.target.value.replace(/\D/g, "") })}
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  {user?.documentUrl ? "Replace File (Optional)" : "Upload Document File"}
                </label>
                <input
                  type="file"
                  onChange={(e) => setKycFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#3b5bdb] hover:file:bg-blue-100"
                />
              </div>
            </div>

            <Button fullWidth isLoading={isUploadingKyc} onClick={handleKycUpload} className="mt-4 rounded-full bg-[#1d2d6d]">
              {user?.documentUrl ? "Update Document" : "Submit KYC"}
            </Button>
          </div>
        </div>
      )}

      {/* 4. SET / UPDATE TRANSACTION PIN MODAL */}
      {activeModal === "pin" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {user?.isPinSet ? "Update Transaction PIN" : "Set Transaction PIN"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <Input
                label="Enter 4-Digit PIN"
                type="password"
                maxLength={4}
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <Button
              fullWidth
              isLoading={isSavingPin}
              disabled={pin.length !== 4}
              onClick={handleSetPin}
              className="mt-4 rounded-full bg-[#1d2d6d]"
            >
              {user?.isPinSet ? "Update PIN" : "Save PIN"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}