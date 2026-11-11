import { useState, useEffect, useRef } from "react";
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
  Bell,
  Eye,
  FileText,
  Copy,
  AlertTriangle,
  Camera,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/utils/format";
import { getSavingsSummary } from "@/services/savings";
import { getActiveLoan } from "@/services/loans";
import { getBanks, verifyBank } from "@/services/payments";
import {
  updatePersonalInfo,
  updateBankDetails,
  uploadKycDocument,
  uploadProfilePicture,
  deleteProfilePicture,
  setTransactionPin,
} from "@/services/user";
import { normalizeUser } from "@/utils/userProfile";
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
  const [referralLink, setReferralLink] = useState("");

  // Stats Data
  const { data: savingsData } = useAsync(getSavingsSummary, []);
  const { data: loanData } = useAsync(getActiveLoan, []);

  const totalSaved = savingsData?.summary?.totalSaved || 0;
  const activeLoan = loanData?.loan || loanData;
  const activeLoanAmount = activeLoan?.remainingBalance || 0;

  const firstName = user?.fullName?.split(" ")[0] ?? "Member";
  const [profileAvatarError, setProfileAvatarError] = useState(false);

  useEffect(() => {
    setProfileAvatarError(false);
  }, [user?.avatarUrl]);
  const regNumber = user?.referralCode || user?._id?.substring(0, 8) || "N/A";
  const greeting = getGreeting();
  const kycStatus = user?.kycStatus || "unverified";

  useEffect(() => {
    if (user?.referralCode) {
      setReferralLink(`${window.location.origin}${ROUTES.REGISTER}?ref=${encodeURIComponent(user.referralCode)}`);
    }
  }, [user?.referralCode]);

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
  // Ref mirror to avoid stale-closure reads in auto-resolve: when the user
  // picks a bank and types the 10th digit in the same interaction, closure
  // `bankDetails` can still hold the previous bankCode/accountNumber and
  // send the WRONG pair to verify-bank (surfaces as FLW "invalid account").
  const bankDetailsRef = useRef(bankDetails);
  useEffect(() => {
    bankDetailsRef.current = bankDetails;
  }, [bankDetails]);
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Bank selection + account auto-resolution state (searchable bank dropdown)
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(null);
  const [bankQuery, setBankQuery] = useState("");
  const [bankOpen, setBankOpen] = useState(false);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState("");
  const [verificationError, setVerificationError] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);

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

  // 5. Profile Photo (CRUD: upload/replace + delete)
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const photoInputRef = useRef(null);

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

  // Load the searchable list of Nigerian banks whenever the bank modal opens.
  useEffect(() => {
    if (activeModal !== "bank") return;

    let cancelled = false;
    const loadBanks = async () => {
      setBanksLoading(true);
      setBanksError(null);
      try {
        const res = await getBanks();
        if (!cancelled) setBanks(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        if (!cancelled) {
          setBanksError(error?.data?.message || error?.message || "Failed to load banks");
        }
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    };

    loadBanks();
    return () => {
      cancelled = true;
    };
  }, [activeModal]);

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

  /**
   * Auto-resolve the account name via the backend (POST /api/payments/verify-bank)
   * whenever a full 10-digit account number + a selected bank are present.
   * Stores the resolved name and flags `accountVerified` for explicit confirmation.
   */
  async function resolveAccount(accountNumber, bankCode) {
    if (!bankCode) {
      setVerificationError("Please select a bank before verifying the account.");
      return;
    }
    setResolvingAccount(true);
    setVerificationError(null);
    try {
      const res = await verifyBank(accountNumber, bankCode);
      const resolved = res?.data || {};
      if (res?.success && resolved.accountName) {
        const name = resolved.accountName;
        setResolvedAccountName(name);
        setBankDetails((d) => ({ ...d, accountName: name, bankCode }));
        setAccountVerified(true);
        setConfirmSave(false);
      } else {
        setAccountVerified(false);
        setResolvedAccountName("");
        setBankDetails((d) => ({ ...d, accountName: "" }));
        setVerificationError(
          res?.message || "Account could not be verified. Please check the account number and bank selection."
        );
      }
    } catch (error) {
      setAccountVerified(false);
      setResolvedAccountName("");
      setBankDetails((d) => ({ ...d, accountName: "" }));
      setVerificationError(
        error?.data?.message || error?.message || "Account verification failed. Please try again."
      );
    } finally {
      setResolvingAccount(false);
    }
  }

  function handleBankSelect(bank) {
    // Always send FLW's string `code` (leading zeros preserved), never `id`.
    const rawCode = bank?.code || bankDetailsRef.current?.bankCode || "058";
    const code = /^\d+$/.test(String(rawCode)) && String(rawCode).length < 3
      ? String(rawCode).padStart(3, "0")
      : String(rawCode);
    const acct = bankDetailsRef.current?.accountNumber || "";
    const nextDetails = { ...bankDetailsRef.current, bankName: bank?.name, bankCode: code };
    bankDetailsRef.current = nextDetails;
    setBankDetails(nextDetails);
    setBankQuery("");
    setBankOpen(false);
    // Re-run resolution for the newly selected bank, if an account number is already typed.
    setAccountVerified(false);
    setResolvedAccountName("");
    setConfirmSave(false);
    if (acct && acct.length === 10) {
      resolveAccount(acct, code);
    }
  }

  function handleAccountNumberChange(value) {
    const digits = value.replace(/\D/g, "");
    const currentCode = bankDetailsRef.current?.bankCode || "058";
    const nextDetails = { ...bankDetailsRef.current, accountNumber: digits };
    bankDetailsRef.current = nextDetails;
    setBankDetails(nextDetails);
    setAccountVerified(false);
    setConfirmSave(false);
    setResolvedAccountName("");
    setVerificationError(null);
    if (digits.length === 10) {
      resolveAccount(digits, currentCode);
    }
  }

  async function handleSaveBankDetails() {
    if (!bankDetails.bankName || !resolvedAccountName || bankDetails.accountNumber.length !== 10) {
      toast.error("Please enter valid 10-digit account details");
      return;
    }
    if (!confirmSave) {
      toast.error("Please confirm the resolved account name before saving");
      return;
    }
    setIsSavingBank(true);
    try {
      const res = await updateBankDetails({
        bankName: bankDetails.bankName,
        bankCode: bankDetails.bankCode,
        accountName: resolvedAccountName,
        accountNumber: bankDetails.accountNumber,
      });
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
    // Owner-approved KYC policy: NIN is mandatory, BVN optional.
    if (!kycData.nin || kycData.nin.length !== 11) {
      toast.error("Your 11-digit NIN is required for verification");
      return;
    }
    if (!kycFile && !user?.documentUrl) {
      toast.error("Please select a document file to upload");
      return;
    }
    setIsUploadingKyc(true);
    const formData = new FormData();
    if (kycFile) formData.append("file", kycFile);
    formData.append("documentType", kycData.documentType);
    formData.append("nin", kycData.nin);
    if (kycData.bvn) formData.append("bvn", kycData.bvn);

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

  async function handleCopyReferralLink() {
    if (!referralLink) {
      toast.error("Referral link is not available yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Unable to copy referral link");
    }
  }

  // --- Profile Photo (CRUD) ---
  // Create/Replace: POST /api/user/profile-picture (Cloudinary-backed, the
  // backend deletes the previous asset). Delete: DELETE /api/user/profile-picture
  // which also destroys the stored asset. The backend response is the only
  // source of truth — the avatar in state is updated from it, never optimistically.
  async function handlePhotoSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Profile picture must be a JPEG, JPG, or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be 5MB or smaller.");
      return;
    }

    setIsUpdatingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadProfilePicture(formData);
      const avatarUrl = res?.data?.avatarUrl || res?.data?.selfieUrl || null;
      if (avatarUrl) {
        setUser((prev) => (prev ? normalizeUser({ ...prev, avatarUrl }) : prev));
      }
      toast.success(res?.message || "Profile picture updated.");
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to update profile picture");
    } finally {
      setIsUpdatingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    setIsUpdatingPhoto(true);
    try {
      const res = await deleteProfilePicture();
      setUser((prev) =>
        prev ? normalizeUser({ ...prev, avatarUrl: null, selfieUrl: null }) : prev
      );
      toast.success(res?.message || "Profile picture removed.");
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Failed to remove profile picture");
    } finally {
      setIsUpdatingPhoto(false);
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

  // Client-side filter over the fetched Nigerian bank list (name + code search).
  const filteredBanks = banks.filter(
    (bank) =>
      (bank?.name || "").toLowerCase().includes(bankQuery.trim().toLowerCase()) ||
      String(bank?.code || "").includes(bankQuery.trim())
  );

  // Show the typed search query when present, otherwise fall back to the
  // selected bank name — prevents the selection from visually disappearing
  // after a dropdown pick clears the search query.
  const bankDisplayValue = bankQuery.trim() ? bankQuery : bankDetails.bankName || "";

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
          <h1 className="text-xl font-bold tracking-tight text-white">Profile & Settings</h1>
         </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-full overflow-hidden border-2 border-[#5b76e1] bg-[#1d2d6d] shrink-0">
              {user?.avatarUrl && !profileAvatarError ? (
                <img
                  src={user.avatarUrl}
                  alt={firstName}
                  className="size-full object-cover"
                  onError={() => setProfileAvatarError(true)}
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center font-bold text-base text-white"
                  style={{ backgroundColor: "#3b5bdb" }}
                >
                  {firstName.charAt(0)}
                </div>
              )}
              {/* CRUD: tap to upload / replace / remove the selfie */}
              <button
                type="button"
                onClick={() => setActiveModal("photo")}
                disabled={isUpdatingPhoto}
                aria-label="Change profile photo"
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-medium leading-tight text-[#bdc8f3]">{greeting}</span>
              <span className="text-sm font-bold tracking-wide leading-snug text-white">
                {user?.fullName || firstName}
              </span>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#bdc8f3]/80">
                <UserCheck className="size-3.5 text-[#7c91e7]" />
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
          <Card className="min-w-[130px] rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm flex-1">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <PiggyBank className="size-4" />
            </div>
            <p className="text-xs font-medium text-gray-500">Total Savings</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{formatNaira(totalSaved)}</p>
          </Card>

          <Card className="min-w-[130px] rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm flex-1">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <HandCoins className="size-4" />
            </div>
            <p className="text-xs font-medium text-gray-500">Active Loan</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{formatNaira(activeLoanAmount)}</p>
          </Card>

          <Card className="min-w-[130px] rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm flex-1">
            <div className="mx-auto mb-2 flex size-9 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <UserCheck className="size-4" />
            </div>
            <p className="text-xs font-medium text-gray-500">Referral Code</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{user?.referralCode || "N/A"}</p>
          </Card>
        </div>

        <Card className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Your referral link</p>
              <p className="mt-1 break-all text-xs text-gray-500">{referralLink || "Referral code unavailable"}</p>
            </div>
            <button
              type="button"
              onClick={handleCopyReferralLink}
              title="Copy referral link"
              aria-label="Copy referral link"
              className="shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </Card>

        {/* Navigation List Cards */}
        <div className="space-y-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={item.action}
                className="w-full flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[#3b5bdb]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 capitalize">
                          {item.badge.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 flex items-center justify-center gap-2 text-red-600 font-semibold text-sm bg-red-50 hover:bg-red-100 rounded-2xl transition-colors mt-6"
        >
          <LogOut className="size-4" />
          Log Out
        </button>
      </div>

      {/* ==================== EDITABLE MODALS ==================== */}

      {/* 1. PERSONAL INFORMATION MODAL */}
      {activeModal === "info" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="size-5 text-gray-500" />
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {/* Searchable bank dropdown — all Nigerian banks with their FLW code */}
              <div className="relative">
                <Input
                  label="Bank"
                  placeholder="Search bank (e.g. GTBank)"
                  value={bankDisplayValue}
                  onChange={(e) => {
                    setBankQuery(e.target.value);
                    setBankOpen(true);
                  }}
                  onFocus={() => setBankOpen(true)}
                  onBlur={() => setBankOpen(false)}
                />
                {bankOpen && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
                    {banksLoading ? (
                      <p className="p-4 text-sm text-gray-500">Loading banks…</p>
                    ) : banksError ? (
                      <p className="p-4 text-sm text-red-600">{banksError}</p>
                    ) : filteredBanks.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">No banks found.</p>
                    ) : (
                      filteredBanks.map((bank) => (
                        <button
                          key={bank.id || bank.code}
                          type="button"
                          onMouseDown={(e) => {
                            // prevent blur-closing before the click registers
                            e.preventDefault();
                            handleBankSelect(bank);
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-semibold text-gray-900">{bank.name}</span>
                          <span className="text-xs font-bold text-gray-600">{bank.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Input
                label="Account Number"
                placeholder="10-digit Account Number"
                maxLength={10}
                inputMode="numeric"
                value={bankDetails.accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
              />

              {resolvingAccount && <p className="text-xs font-medium text-gray-500">Verifying account…</p>}
              {verificationError && <p className="text-xs font-medium text-red-600">{verificationError}</p>}

              {accountVerified && resolvedAccountName && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-800">
                    Verified account name: {resolvedAccountName}
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={confirmSave}
                      onChange={(e) => setConfirmSave(e.target.checked)}
                      className="h-4 w-4 accent-[#1d2d6d]"
                    />
                    I confirm this account belongs to me
                  </label>
                </div>
              )}
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">KYC Verification</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            {/* Rejected → in-app replacement affordance (owner decision #1) */}
            {kycStatus === "rejected" && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" /> Document Rejected — Replacement Required
                </p>
                {user?.kycRejectionReason && (
                  <p className="text-[11px] text-red-600 mt-1">Reason: {user.kycRejectionReason}</p>
                )}
                <p className="text-[11px] text-gray-500 mt-1">
                  Please update your document below. Your submission returns to the admin verification queue automatically.
                </p>
              </div>
            )}

            {/* Existing Document Preview Badge */}
            {user?.documentUrl && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-5 text-[#3b5bdb]" />
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
                  <Eye className="size-3.5" /> View
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
                label="NIN (11 Digits) — Required"
                maxLength={11}
                placeholder="Required (11 digits)"
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
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {user?.isPinSet ? "Update Transaction PIN" : "Set Transaction PIN"}
              </h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="size-5 text-gray-500" />
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

      {/* 5. PROFILE PHOTO (CRUD) MODAL */}
      {activeModal === "photo" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full p-1 transition-colors hover:bg-gray-100">
                <X className="size-5 text-gray-500" />
              </button>
            </div>

            {/* Current photo preview */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="relative size-28 rounded-full overflow-hidden border-4 border-indigo-100 bg-[#1d2d6d]">
                {user?.avatarUrl && !profileAvatarError ? (
                  <img
                    src={user.avatarUrl}
                    alt={firstName}
                    className="size-full object-cover"
                    onError={() => setProfileAvatarError(true)}
                  />
                ) : (
                  <div
                    className="flex size-full items-center justify-center font-bold text-3xl text-white"
                    style={{ backgroundColor: "#3b5bdb" }}
                  >
                    {firstName.charAt(0)}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {user?.avatarUrl ? "Your profile photo is visible to verify your identity." : "Add a photo so members can recognize you."}
              </p>
            </div>

            {/* Hidden file input for upload/replace */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handlePhotoSelected}
            />

            <div className="space-y-2.5 pt-1">
              <Button
                fullWidth
                isLoading={isUpdatingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="rounded-full bg-[#1d2d6d]"
              >
                <ImagePlus className="size-4" />
                {user?.avatarUrl ? "Replace Photo" : "Upload Photo"}
              </Button>

              {user?.avatarUrl && (
                <Button
                  fullWidth
                  variant="outline"
                  isLoading={isUpdatingPhoto}
                  onClick={handleRemovePhoto}
                  className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  Remove Photo
                </Button>
              )}

              <Button
                fullWidth
                variant="outline"
                onClick={() => setActiveModal(null)}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}