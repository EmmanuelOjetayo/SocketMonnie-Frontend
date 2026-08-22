import { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  X,
  Check,
  Ban,
  UserCheck,
  FileText,
  Building2,
  Banknote,
  TrendingUp,
  Award,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Phone,
  Mail,
  Calendar,
  Hash,
  ExternalLink,
  Clock,
  AlertTriangle,
  Copy,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAsync } from "@/hooks/useAsync";
import {
  getMembers,
  suspendMember,
  getMemberById,
  approveKYC,
  rejectKYC,
  activateMember,
} from "@/services/adminService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import toast from "react-hot-toast";
import { formatNaira, formatDate, getScoreRating } from "@/utils/format";

// ─── CUSTOM DEBOUNCE HOOK ────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── TOP HEADER COMPONENT ────────────────────────────────
export function AdminHeader({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-5 text-white shadow-md rounded-b-[24px]"
      style={{
        background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-[#dee3f9]/70" />
          <input
            type="text"
            placeholder="Search member, loan #, phone... (Press Enter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-xl border border-[#bdc8f3]/30 bg-white/10 py-2 pl-9 pr-4 text-xs font-medium text-white placeholder:text-[#dee3f9]/60 backdrop-blur-md transition-all focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          System Active
        </div>

        <button className="relative rounded-full p-2 text-[#dee3f9] hover:bg-white/10 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
}

// ─── BADGE UTILITIES ─────────────────────────────────────
function kycBadgeVariant(status) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending_review") return "warning";
  return "outline";
}

function TierBadge({ tier }) {
  const colors = {
    Bronze: "bg-amber-100 text-amber-800 border-amber-300",
    Silver: "bg-slate-100 text-slate-800 border-slate-300",
    Gold: "bg-yellow-100 text-yellow-800 border-yellow-400",
    Platinum: "bg-blue-100 text-blue-800 border-blue-400",
  };
  const cls = colors[tier] || colors.Bronze;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>
      <Award className="w-3 h-3" />
      {tier || "Bronze"}
    </span>
  );
}

// ─── KYC LIGHTBOX PREVIEW ─────────────────────────────────
function KycDocumentPreview({ doc, onClose }) {
  if (!doc) return null;

  const docUrl = typeof doc === "string" ? doc : (doc.documentUrl || doc.fileUrl || doc.url || doc.path);
  const docType = typeof doc === "object" ? (doc.type || doc.name || "KYC Document") : "KYC Document";

  if (!docUrl) return null;

  const isPdf = /\.pdf($|\?)/i.test(docUrl);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh] w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#dee3f9] bg-[#dee3f9]/30">
          <span className="text-xs font-bold text-[#090f24] flex items-center gap-2 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-emerald-600" />
            {docType.replace("_", " ")}
          </span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 flex-1 flex items-center justify-center bg-slate-900 min-h-[300px] max-h-[calc(90vh-60px)] overflow-auto">
          {isPdf ? (
            <iframe src={docUrl} className="w-full h-[70vh] rounded-xl bg-white" title="KYC Document" />
          ) : (
            <img 
              src={docUrl} 
              alt="KYC Document" 
              className="max-w-full max-h-[70vh] rounded-xl shadow-md object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="text-center p-6 text-white"><p class="mb-2">Unable to load image preview.</p><a href="${docUrl}" target="_blank" rel="noreferrer" class="px-4 py-2 bg-[#131e49] rounded-xl text-xs font-bold text-white inline-block">Open Original File</a></div>`;
              }} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MINI STAT CARD ──────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color = "brand" }) {
  return (
    <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-gray-500">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
      </div>
      <p className="text-base font-extrabold text-[#090f24]">{value ?? "—"}</p>
    </div>
  );
}

// ─── INFO ROW COMPONENT ──────────────────────────────────
function InfoRow({ icon: Icon, label, value, copyable }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (value && copyable) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-500 font-medium">{label}</p>
        <p className="text-xs font-semibold text-[#090f24] truncate flex items-center gap-1.5">
          {value || "—"}
          {copyable && value && (
            <button onClick={handleCopy} className="text-gray-400 hover:text-[#131e49] transition-colors" title="Copy">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

// ─── SECTION TITLE ───────────────────────────────────────
function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-extrabold text-[#090f24] flex items-center gap-2 uppercase tracking-wider">
        {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
        {title}
      </h3>
      {action}
    </div>
  );
}

// ─── TIMELINE ITEM ───────────────────────────────────────
function TimelineItem({ icon: Icon, title, subtitle, date, color = "brand" }) {
  const dotColors = {
    brand: "bg-[#131e49]",
    success: "bg-emerald-500",
    danger: "bg-rose-500",
    slate: "bg-slate-400",
  };

  return (
    <div className="flex gap-3 pb-3 relative">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${dotColors[color] || dotColors.slate} ring-2 ring-white`} />
        <div className="w-px flex-1 bg-[#dee3f9] mt-1" />
      </div>
      <div className="flex-1 pb-1">
        <p className="text-xs font-bold text-[#090f24] flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
          {title}
        </p>
        {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        {date && <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(date, "MMM dd, yyyy h:mm a")}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN MEMBERS COMPONENT
// ═══════════════════════════════════════════════════════════

export function AdminMembers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Data Fetching
  const { data, isLoading, refetch } = useAsync(
    () => getMembers({ status: statusFilter, search: debouncedSearch, page, limit }),
    [statusFilter, debouncedSearch, page]
  );

  // Response Payload Normalization
  const members = data?.data?.members || data?.members || data?.data || [];
  const pagination = data?.data?.pagination || data?.pagination || {};
  const totalCount = pagination.total || members.length;
  const totalPages = pagination.pages || Math.ceil(totalCount / limit) || 1;

  // Drawer / Detail State
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action Loading Indicators
  const [isSuspending, setIsSuspending] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isApprovingKyc, setIsApprovingKyc] = useState(false);
  const [isRejectingKyc, setIsRejectingKyc] = useState(false);

  // Dialog & Lightbox Targets
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [kycRejectTarget, setKycRejectTarget] = useState(null);
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  const activeRequestId = useRef(0);

  async function openMemberDetail(memberItem) {
    const memberId = memberItem._id || memberItem.id;
    const currentReq = ++activeRequestId.current;

    setSelectedMember(memberItem);
    setLoadingDetail(true);
    setDetailData(null);

    try {
      const res = await getMemberById(memberId);
      if (currentReq === activeRequestId.current) {
        setDetailData(res?.data || res);
      }
    } catch (err) {
      if (currentReq === activeRequestId.current) {
        toast.error(err?.response?.data?.message || err?.data?.message || "Failed to load member details");
      }
    } finally {
      if (currentReq === activeRequestId.current) {
        setLoadingDetail(false);
      }
    }
  }

  async function refreshCurrentDetail(memberItem) {
    if (!memberItem) return;
    const memberId = memberItem._id || memberItem.id;
    try {
      const res = await getMemberById(memberId);
      setDetailData(res?.data || res);
    } catch (err) {
      toast.error("Could not sync updated details");
    }
  }

  function closeDetail() {
    setSelectedMember(null);
    setDetailData(null);
  }

  async function handleSuspend(userId) {
    setIsSuspending(true);
    try {
      await suspendMember(userId, "Admin suspension");
      toast.success("Member suspended successfully");
      setSuspendTarget(null);
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.data?.message || "Failed to suspend member");
    } finally {
      setIsSuspending(false);
    }
  }

  async function handleActivate(userId) {
    setIsActivating(true);
    try {
      await activateMember(userId);
      toast.success("Member activated successfully");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.data?.message || "Failed to activate member");
    } finally {
      setIsActivating(false);
    }
  }

  async function handleKycApprove(userId) {
    setIsApprovingKyc(true);
    try {
      await approveKYC(userId);
      toast.success("KYC submission approved");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.data?.message || "Failed to approve KYC");
    } finally {
      setIsApprovingKyc(false);
    }
  }

  async function handleKycReject(userId) {
    if (!kycRejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setIsRejectingKyc(true);
    try {
      await rejectKYC(userId, kycRejectReason);
      toast.success("KYC submission rejected");
      setKycRejectTarget(null);
      setKycRejectReason("");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.data?.message || "Failed to reject KYC");
    } finally {
      setIsRejectingKyc(false);
    }
  }

  // Active Member Model Extraction
  const member = detailData?.member || selectedMember || {};
  const stats = detailData?.stats || {};
  const scoreHistory = detailData?.scoreHistory || [];
  const scoreBreakdown = member.socketScoreBreakdown || {};
  const scoreRating = getScoreRating(member.socketScore || 0);
  const bankInfo = member.bankDetails || {};
  const kycStatus = member.kycStatus || "unverified";
  const kycRejectionReason = member.kycRejectionReason;

  const netSavings = (stats.totalSavings || 0) - (stats.totalWithdrawn || 0);
  const eligibleLoan = member.eligibleLoanAmount !== undefined 
    ? member.eligibleLoanAmount 
    : netSavings * (member.loanCount === 0 ? 0.7 : member.loanCount === 1 ? 1.0 : 1.5);

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* ── TOP HEADER ───────────────────────────────────── */}
      <AdminHeader 
        onSearch={(q) => setSearch(q)} 
      />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        
        {/* Members Operations Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, #1d2d6d 0%, #131e49 50%, #090f24 100%)",
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#dee3f9]">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold">Directory Administration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Members Directory
            </h1>
            <p className="mt-0.5 text-xs text-[#dee3f9]/80">
              Manage cooperative membership, verification status, and profile limits.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-block rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-extrabold text-[#dee3f9]">
              {totalCount} Total Members
            </span>
          </div>
        </div>

        {/* ── SEARCH & STATUS FILTERS ────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, phone, or code..."
              icon={Search}
              className="rounded-2xl border-[#bdc8f3]/40 bg-white text-xs shadow-sm focus:ring-[#131e49]/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 sm:flex-initial rounded-2xl border border-[#bdc8f3]/40 bg-white px-3 py-2 text-xs font-semibold text-[#090f24] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* ── MAIN TABLE ─────────────────────────────────── */}
        {isLoading ? (
          <LoadingState rows={6} />
        ) : members.length === 0 ? (
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
            <EmptyState title="No members found" description="Try adjusting your filter or search keywords." />
          </Card>
        ) : (
          <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white shadow-sm overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#dee3f9]/30 border-b border-[#dee3f9] text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Socket Score</th>
                    <th className="px-4 py-3">KYC Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee3f9]">
                  {members.map((m) => {
                    const rating = getScoreRating(m.socketScore || 0);
                    return (
                      <tr key={m._id || m.id} className="hover:bg-[#dee3f9]/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#090f24]">
                          <p>{m.fullName}</p>
                          <span className="text-[10px] font-normal text-gray-500">{m._id || m.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600">{m.email}</p>
                          <p className="text-gray-500 text-[11px]">{m.phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <TierBadge tier={m.tier || "Bronze"} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            rating.tier === "elite" ? "bg-yellow-100 text-yellow-800" :
                            rating.tier === "excellent" ? "bg-emerald-100 text-emerald-800" :
                            rating.tier === "good" ? "bg-blue-100 text-blue-800" :
                            rating.tier === "fair" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {m.socketScore || 0} — {rating.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={kycBadgeVariant(m.kycStatus)}>
                            {m.kycStatus?.replace("_", " ") || "unverified"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Eye}
                            onClick={() => openMemberDetail(m)}
                            className="rounded-xl text-[#3b5bdb] hover:bg-[#dee3f9]/40 font-bold"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-[#dee3f9]/20 border-t border-[#dee3f9] flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Page {page} of {totalPages} ({totalCount} items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  icon={ChevronLeft}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border-[#bdc8f3]/40 bg-white"
                >
                  Previous
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border-[#bdc8f3]/40 bg-white"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── MEMBER INSPECTION DRAWER ─────────────────────── */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white border-l border-[#bdc8f3]/40 h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-[#dee3f9] flex items-center justify-between bg-[#dee3f9]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#131e49] text-white flex items-center justify-center font-black text-base shadow-sm">
                    {member.fullName?.charAt(0) || "M"}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#090f24] flex items-center gap-2">
                      {member.fullName}
                      <TierBadge tier={member.tier} />
                    </h2>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <button onClick={closeDetail} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {loadingDetail ? (
                  <LoadingState rows={5} />
                ) : (
                  <>
                    {/* Drawer Toolbar */}
                    <div className="flex items-center gap-2 pb-3 border-b border-[#dee3f9] flex-wrap">
                      {member.status === "suspended" ? (
                        <Button
                          size="sm"
                          variant="success"
                          icon={UserCheck}
                          disabled={isActivating}
                          onClick={() => handleActivate(member._id || member.id)}
                          className="rounded-xl font-bold"
                        >
                          {isActivating ? "Activating..." : "Activate Account"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Ban}
                          disabled={isSuspending}
                          onClick={() => setSuspendTarget(member._id || member.id)}
                          className="rounded-xl font-bold"
                        >
                          Suspend Account
                        </Button>
                      )}

                      {kycStatus === "pending_review" && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            icon={Check}
                            disabled={isApprovingKyc}
                            onClick={() => handleKycApprove(member._id || member.id)}
                            className="rounded-xl font-bold"
                          >
                            {isApprovingKyc ? "Approving..." : "Approve KYC"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={X}
                            disabled={isRejectingKyc}
                            onClick={() => setKycRejectTarget(member._id || member.id)}
                            className="rounded-xl border-[#bdc8f3]/40 font-bold"
                          >
                            Reject KYC
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Stat Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <MiniStat label="Total Savings" value={formatNaira(stats.totalSavings || 0)} icon={Banknote} color="success" />
                      <MiniStat label="Net Balance" value={formatNaira(netSavings)} icon={TrendingUp} color="brand" />
                      <MiniStat label="Eligible Loan" value={formatNaira(eligibleLoan)} icon={Building2} color="purple" />
                      <MiniStat label="Active Loans" value={stats.activeLoansCount || 0} icon={FileText} color="amber" />
                    </div>

                    {/* Member Profile & Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#dee3f9]/15 p-4 rounded-2xl border border-[#bdc8f3]/30">
                      <div>
                        <SectionTitle icon={Users} title="Member Profile" />
                        <InfoRow icon={Phone} label="Phone Number" value={member.phone} copyable />
                        <InfoRow icon={Mail} label="Email Address" value={member.email} copyable />
                        <InfoRow icon={Calendar} label="Member Since" value={formatDate(member.createdAt, "PPP")} />
                        <InfoRow icon={Hash} label="User ID" value={member._id || member.id} copyable />
                      </div>
                      <div>
                        <SectionTitle icon={Building2} title="Disbursement Settlement" />
                        <InfoRow icon={Building2} label="Bank" value={bankInfo.bankName} />
                        <InfoRow icon={Hash} label="Account No." value={bankInfo.accountNumber} copyable />
                        <InfoRow icon={Users} label="Account Name" value={bankInfo.accountName} />
                        <InfoRow icon={Shield} label="BVN" value={member.bvn ? `••••${member.bvn.slice(-4)}` : "Not Provided"} />
                      </div>
                    </div>

                    {/* Socket Score Breakdown */}
                    <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs space-y-3">
                      <SectionTitle icon={Award} title="Socket Credit Score Breakdown" />
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <ProgressRing progress={((member.socketScore || 0) / 850) * 100} size={80} strokeWidth={8}>
                            <span className="text-lg font-black text-[#090f24]">{member.socketScore || 0}</span>
                          </ProgressRing>
                          <span className="text-xs font-bold mt-1 text-gray-500">{scoreRating.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1 text-xs">
                          <div>
                            <span className="text-gray-500">Savings Habit</span>
                            <p className="font-semibold text-[#090f24]">{scoreBreakdown.savingsConsistency || 0} / 250</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Repayment Metric</span>
                            <p className="font-semibold text-[#090f24]">{scoreBreakdown.repaymentHistory || 0} / 350</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tenure Rating</span>
                            <p className="font-semibold text-[#090f24]">{scoreBreakdown.accountAge || 0} / 150</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Guarantor Trust</span>
                            <p className="font-semibold text-[#090f24]">{scoreBreakdown.guarantorTrust || 0} / 100</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KYC Section (Handles single objects, strings, arrays, or documentUrl) */}
                    <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs">
                      <SectionTitle icon={Shield} title="KYC Verification" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-medium">Verification Status</span>
                        <Badge variant={kycBadgeVariant(kycStatus)}>
                          {kycStatus.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      {kycRejectionReason && (
                        <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Rejection Reason:</p>
                            <p>{kycRejectionReason}</p>
                          </div>
                        </div>
                      )}

                      {(() => {
                        const docs = Array.isArray(member.kycDocuments) && member.kycDocuments.length > 0
                          ? member.kycDocuments
                          : Array.isArray(member.kyc) && member.kyc.length > 0
                          ? member.kyc
                          : member.documentUrl || member.kycDocument
                          ? [{ documentUrl: member.documentUrl || member.kycDocument, type: "ID Document" }]
                          : [];

                        if (docs.length === 0) {
                          return <p className="text-xs text-gray-400 italic">No KYC documents submitted.</p>;
                        }

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {docs.map((docItem, idx) => {
                              const docLabel = typeof docItem === "object" ? (docItem.type || `Document ${idx + 1}`) : `Document ${idx + 1}`;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewDoc(docItem)}
                                  className="p-2.5 rounded-2xl border border-[#bdc8f3]/40 bg-[#dee3f9]/15 hover:border-[#131e49] hover:shadow-xs cursor-pointer transition-all flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-[#090f24] truncate">
                                      {docLabel.replace("_", " ")}
                                    </p>
                                    <span className="text-[10px] text-[#3b5bdb] font-extrabold block">
                                      Inspect document
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Score Timeline */}
                    {scoreHistory.length > 0 && (
                      <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs">
                        <SectionTitle icon={Clock} title="Credit Score Audit" />
                        <div className="mt-3 pl-2">
                          {scoreHistory.map((item, idx) => (
                            <TimelineItem
                              key={idx}
                              title={`${item.change > 0 ? "+" : ""}${item.change} Points`}
                              subtitle={item.reason}
                              date={item.createdAt}
                              color={item.change >= 0 ? "success" : "danger"}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT PREVIEW LIGHTBOX ──────────────────── */}
        {previewDoc && (
          <KycDocumentPreview
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
          />
        )}

        {/* ── SUSPEND CONFIRMATION DIALOG ────────────────── */}
        <ConfirmDialog
          isOpen={!!suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={() => handleSuspend(suspendTarget)}
          title="Suspend Member Account"
          description="Are you sure you want to suspend this member? They will lose access to member actions until reactivated."
          confirmLabel={isSuspending ? "Suspending..." : "Confirm Suspension"}
          variant="danger"
        />

        {/* ── REJECT KYC DIALOG ──────────────────────────── */}
        {kycRejectTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-[#bdc8f3]/40 space-y-4">
              <h3 className="text-base font-bold text-[#090f24] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Reject KYC Submission
              </h3>
              <p className="text-xs text-gray-500">
                Enter the reason for rejection. This description will be shown directly to the member.
              </p>
              <textarea
                className="w-full h-24 p-3 text-xs font-medium rounded-2xl border border-[#bdc8f3]/40 bg-white text-[#090f24] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#131e49]/20"
                placeholder="e.g., Provided ID card image is blurred or expired..."
                value={kycRejectReason}
                onChange={(e) => setKycRejectReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setKycRejectTarget(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isRejectingKyc}
                  onClick={() => handleKycReject(kycRejectTarget)}
                  className="rounded-xl font-bold"
                >
                  {isRejectingKyc ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}