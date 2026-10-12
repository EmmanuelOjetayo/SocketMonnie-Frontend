import { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  X,
  Check,
  Ban,
  Users,
  TrendingUp,
  FileText,
  Building2,
  Banknote,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useAsync } from "@/hooks/useAsync";
import { markAllNotificationsRead } from "@/services/notifications";
import { getMembers, suspendMember, getMemberById, approveKYC, rejectKYC, activateMember } from "@/services/adminService";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNaira, formatDate, getScoreRating } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";

// Helper: compute score badge class without nested template literals
function getScoreBadgeClass(score) {
  const tier = getScoreRating(score);
  const tierMap = {
    elite: "bg-yellow-100 text-yellow-800",
    excellent: "bg-emerald-100 text-emerald-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-amber-100 text-amber-800",
  };
  const defaultTier = "bg-rose-100 text-rose-800";
  const key = tier ? tier.replace(" ", "").toLowerCase() : "fair";
  const classes = tierMap[key] || defaultTier;
  return `text-[10px] font-extrabold px-2 py-0.5 rounded-full ${classes}`;
}

export function AdminMembers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useRef(search).current;
  // Re-derive on each render to pick up latest search value

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

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

  // Detail State
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
        console.error("Failed to load member details:", err);
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
      console.error("Could not sync updated details:", err);
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
      console.log("Member suspended successfully");
      setSuspendTarget(null);
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      console.error("Failed to suspend member:", error);
    } finally {
      setIsSuspending(false);
    }
  }

  async function handleActivate(userId) {
    setIsActivating(true);
    try {
      await activateMember(userId);
      console.log("Member activated successfully");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      console.error("Failed to activate member:", error);
    } finally {
      setIsActivating(false);
    }
  }

  async function handleKycApprove(userId) {
    setIsApprovingKyc(true);
    try {
      await approveKYC(userId);
      console.log("KYC approved");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      console.error("Failed to approve KYC:", error);
    } finally {
      setIsApprovingKyc(false);
    }
  }

  async function handleKycReject(userId) {
    if (!kycRejectReason.trim()) {
      console.error("Rejection reason is required");
      return;
    }
    setIsRejectingKyc(true);
    try {
      await rejectKYC(userId, kycRejectReason);
      console.log("KYC rejected");
      setKycRejectTarget(null);
      setKycRejectReason("");
      await refetch();
      if (selectedMember) await refreshCurrentDetail(selectedMember);
    } catch (error) {
      console.error("Failed to reject KYC:", error);
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
  const eligibleLoan =
    member.eligibleLoanAmount !== undefined
      ? member.eligibleLoanAmount
      : netSavings * (member.loanCount === 0 ? 0.7 : member.loanCount === 1 ? 1.0 : 1.5);

  // Custom badge variant function (replacing kycBadgeVariant utility)
  function kycBadgeVariant(status) {
    if (status === "approved") return "success";
    if (status === "rejected") return "danger";
    if (status === "pending_review") return "warning";
    return "outline";
  }

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* ── TOP HEADER ───────────────────────────────────── */}
      <TopHeader
        onSearch={(q) => setSearch(q)}
      />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        {/* Members Operations Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: "linear-gradient(135deg, #5B76E1 0%, #32417B 50%, #090f24 100%)" }}
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
              className="rounded-2xl border-[#bdc8f3]/30 bg-white text-xs shadow-sm focus:ring-[#131e49]/20"
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
                          <Badge variant={m.tier ? "brand" : "outline"} className="text-[10px] font-bold">
                            {m.tier || "Bronze"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {/* Score & Rating Label */}
                          <span className={getScoreBadgeClass(m.socketScore || 0)}>{m.socketScore || 0} — {rating.label}</span>
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
                      <Badge tier={member.tier} />
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
                      <span className="text-xs font-medium text-gray-500">Total Savings</span>
                      <span className="text-base font-extrabold text-[#090f24]">{formatNaira(stats.totalSavings || 0)}</span>
                      <span className="text-xs font-medium text-gray-500">Net Balance</span>
                      <span className="text-base font-extrabold text-[#090f24]">{formatNaira(netSavings)}</span>
                      <span className="text-xs font-medium text-gray-500">Eligible Loan</span>
                      <span className="text-base font-extrabold text-[#090f24]">{formatNaira(eligibleLoan)}</span>
                      <span className="text-xs font-medium text-gray-500">Active Loans</span>
                      <span className="text-base font-extrabold text-[#090f24]">{stats.activeLoansCount || 0}</span>
                    </div>

                    {/* Member Profile & Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#dee3f9]/15 p-4 rounded-2xl border border-[#bdc8f3]/30">
                      <div>
                        <div className="text-xs font-medium text-gray-500">Phone Number</div>
                        <div className="font-bold text-[#090f24]">{member.phone}</div>
                        <div className="text-xs font-medium text-gray-500">Email Address</div>
                        <div className="font-bold text-[#090f24] truncate">{member.email}</div>
                        <div className="text-xs font-medium text-gray-500">Member Since</div>
                        <div className="font-bold text-[#090f24]">{formatDate(member.createdAt, "PPP")}</div>
                        <div className="text-xs font-medium text-gray-500">User ID</div>
                        <div className="font-bold text-[#090f24]" copyable>{member._id || member.id}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500">Bank</div>
                        <div className="font-bold text-[#090f24]">{bankInfo.bankName}</div>
                        <div className="text-xs font-medium text-gray-500">Account No.</div>
                        <div className="font-bold text-[#090f24] copyable">{bankInfo.accountNumber}</div>
                        <div className="text-xs font-medium text-gray-500">Account Name</div>
                        <div className="font-bold text-[#090f24]">{bankInfo.accountName}</div>
                        <div className="text-xs font-medium text-gray-500">BVN</div>
                        <div className="font-bold text-[#090f24]">
                          {member.bvn ? `••••${member.bvn.slice(-4)}` : "Not Provided"}
                        </div>
                      </div>
                    </div>

                    {/* Socket Score Breakdown */}
                    <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs space-y-3">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <ProgressRing
                            progress={Math.min(100, Math.max(0, Number(member.socketScore) || 0))}
                            size={80}
                            strokeWidth={8}
                          >
                            <span className="text-lg font-black text-[#090f24]">
                              {member.socketScore || 0}
                            </span>
                          </ProgressRing>
                          <span className="text-xs font-bold mt-1 text-gray-500">{scoreRating.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1 text-xs">
                          <div>
                            <span className="text-gray-500">Savings Habit</span>
                            <p className="font-semibold text-[#090f24]">
                              {scoreBreakdown.savingsConsistency || 0} / 250
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Repayment Metric</span>
                            <p className="font-semibold text-[#090f24]">
                              {scoreBreakdown.repaymentHistory || 0} / 350
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tenure Rating</span>
                            <p className="font-semibold text-[#090f24]">
                              {scoreBreakdown.accountAge || 0} / 150
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Guarantor Trust</span>
                            <p className="font-semibold text-[#090f24]">
                              {scoreBreakdown.guarantorTrust || 0} / 100
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KYC Section */}
                    <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs">
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
                    {scoreHistory.length > 0 && (() => {
                      const monthlyScores = scoreHistory.reduce((acc, item) => {
                        const year = item.period?.year;
                        const month = item.period?.month;

                        if (!year || !month) return acc;

                        const key = `${year}-${String(month).padStart(2, "0")}`;

                        if (!acc[key]) {
                          acc[key] = {
                            year,
                            month,
                            overallScores: [],
                            breakdown: {
                              savingsConsistency: 0,
                              savingsGrowth: 0,
                              loanRepayment: 0,
                              withdrawalBehaviour: 0,
                              profileCompletion: 0,
                              communityTrust: 0,
                            },
                          };
                        }

                        acc[key].overallScores.push(Number(item.overallScore) || 0);

                        Object.keys(acc[key].breakdown).forEach((component) => {
                          acc[key].breakdown[component] = Math.max(
                            acc[key].breakdown[component],
                            Number(item.breakdown?.[component]) || 0
                          );
                        });

                        return acc;
                      }, {});

                      const monthlyHistory = Object.values(monthlyScores)
                        .sort((a, b) => {
                          if (a.year !== b.year) return b.year - a.year;
                          return b.month - a.month;
                        })
                        .map((item) => ({
                          ...item,
                          overallScore: Math.max(...item.overallScores),
                        }));

                      const formatMonth = (year, month) =>
                        new Date(year, month - 1).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });

                      return (
                        <div className="bg-white p-4 rounded-2xl border border-[#bdc8f3]/40 shadow-xs">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[#090f24] uppercase tracking-wider">Monthly Socket Score</span>
                          </div>

                          <div className="space-y-4 mt-3">
                            {monthlyHistory.map((item) => {
                              const rating = getScoreRating(item.overallScore);

                              return (
                                <div
                                  key={`${item.year}-${item.month}`}
                                  className="rounded-2xl border border-[#bdc8f3]/30 bg-[#dee3f9]/10 p-4"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="text-sm font-extrabold text-[#090f24]">
                                        {formatMonth(item.year, item.month)}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        Monthly aggregate
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="text-2xl font-black text-[#131e49]">
                                        {item.overallScore}
                                      </p>
                                      <span className="text-[10px] font-bold text-gray-500">
                                        {rating.label}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    <span className="text-xs font-bold text-[#090f24]">Savings Consistency</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.savingsConsistency}</p>

                                    <span className="text-xs font-bold text-[#090f24]">Savings Growth</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.savingsGrowth}</p>

                                    <span className="text-xs font-bold text-[#090f24]">Loan Repayment</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.loanRepayment}</p>

                                    <span className="text-xs font-bold text-[#090f24]">Withdrawal Behaviour</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.withdrawalBehaviour}</p>

                                    <span className="text-xs font-bold text-[#090f24]">Profile Completion</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.profileCompletion}</p>

                                    <span className="text-xs font-bold text-[#090f24]">Community Trust</span>
                                    <p className="text-xs font-medium text-[#090f24]">{item.breakdown.communityTrust}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT PREVIEW LIGHTBOX ──────────────────── */}
        {previewDoc && (
          <KycDocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
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