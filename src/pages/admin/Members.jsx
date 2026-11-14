import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Search, Eye, X, Check, Ban, UserCheck, FileText, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getMembers, getMemberById, suspendMember, activateMember, approveKYC, rejectKYC } from "@/services/adminService";
import { formatNaira, formatDate, getScoreRating } from "@/utils/format";
import { AdminPageShell, AdminHero, AdminStatusBadge } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { KycDocumentPreview } from "@/components/modals/KycDocumentPreview";

function scoreBadgeClass(score) {
  const rating = getScoreRating(Number(score || 0));
  const tone = {
    elite: "bg-yellow-100 text-yellow-800",
    excellent: "bg-emerald-100 text-emerald-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-amber-100 text-amber-800",
    risky: "bg-rose-100 text-rose-800",
  }[rating.tier] || "bg-gray-100 text-gray-700";
  return `inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tone}`;
}

function MemberField({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold text-[#090f24] ${mono ? "font-mono text-xs" : ""}`}>{value ?? "—"}</p>
    </div>
  );
}

export function AdminMembers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const { data, isLoading, error, refetch } = useAsync(
    () => getMembers({ status: statusFilter || undefined, search: debouncedSearch || undefined, page, limit }),
    [statusFilter, debouncedSearch, page]
  );

  const members = data?.members || data?.data?.members || (Array.isArray(data?.data) ? data.data : []) || [];
  const pagination = data?.pagination || data?.data?.pagination || {};
  const totalCount = Number(pagination.total || members.length || 0);
  const totalPages = Math.max(1, Number(pagination.totalPages || pagination.pages || Math.ceil(totalCount / limit) || 1));

  const [selectedMember, setSelectedMember] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [kycRejectTarget, setKycRejectTarget] = useState(null);
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [busy, setBusy] = useState({ suspend: false, activate: false, approve: false, reject: false });
  const reqId = useRef(0);

  async function loadDetail(memberRow, { silent = false } = {}) {
    const id = memberRow?._id || memberRow?.id;
    if (!id) return;
    const current = ++reqId.current;
    if (!silent) {
      setDetailLoading(true);
      setDetailError(null);
    }
    try {
      const res = await getMemberById(id);
      if (current !== reqId.current) return;
      setDetail(res?.member ? res : (res?.data || res));
    } catch (err) {
      if (current !== reqId.current) return;
      setDetailError(err?.data?.message || err?.message || "Failed to load member details.");
      if (!silent) toast.error(err?.data?.message || err?.message || "Failed to load member details.");
    } finally {
      if (current === reqId.current) setDetailLoading(false);
    }
  }

  function openDetail(row) {
    setSelectedMember(row);
    setDetail(null);
    setDetailError(null);
    loadDetail(row);
  }
  function closeDetail() {
    setSelectedMember(null);
    setDetail(null);
    setDetailError(null);
  }

  async function runAction(key, fn, successMsg) {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      await fn();
      toast.success(successMsg);
      await refetch();
      if (selectedMember) await loadDetail(selectedMember, { silent: true });
      return true;
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Action failed.");
      return false;
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  const member = detail?.member || selectedMember || {};
  const stats = detail?.stats || {};
  const scoreHistory = Array.isArray(detail?.scoreHistory) ? detail.scoreHistory : [];
  const memberId = member?._id || member?.id;
  const netSavings = Number(stats.totalSavings || 0);
  const totalWithdrawn = Number(stats.totalWithdrawn || 0);
  const score = Number(member.socketScore || 0);
  const rating = getScoreRating(score);
  const kycStatus = member.kycStatus || "unverified";
  const kycDocs = Array.isArray(member.kycDocuments) && member.kycDocuments.length
    ? member.kycDocuments
    : Array.isArray(member.kyc) && member.kyc.length
      ? member.kyc
      : member.documentUrl || member.kycDocument
        ? [{ documentUrl: member.documentUrl || member.kycDocument, type: "KYC Document" }]
        : [];

  return (
    <AdminPageShell>
      <AdminHero
        icon={Users}
        eyebrow="Member Administration"
        title="Members Directory"
        description="Search members, review profiles and KYC, and perform account actions through live admin APIs."
        actions={
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white">
            {totalCount.toLocaleString()} total members
          </div>
        }
      />

      <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-8">
            <Input
              icon={Search}
              placeholder="Search by name, email, phone, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="md:col-span-4">
            <select
              className="h-12 w-full rounded-xl border border-[#bdc8f3]/40 bg-white px-3 text-sm font-semibold text-[#090f24] focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/15"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All account statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : error ? (
        <ErrorState
          title="Could not load members"
          description={error?.data?.message || error?.message || "The members list is unavailable right now."}
          onRetry={refetch}
        />
      ) : members.length === 0 ? (
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-6 shadow-sm">
          <EmptyState title="No members found" description="Try adjusting your search or status filter." />
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {members.map((m) => {
              const id = m._id || m.id;
              const r = getScoreRating(Number(m.socketScore || 0));
              return (
                <Card key={id} className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#090f24]">{m.fullName || "Unnamed member"}</p>
                      <p className="truncate text-xs text-text-secondary">{m.email || "—"}</p>
                      <p className="text-xs text-text-muted">{m.phone || "—"}</p>
                    </div>
                    <Button size="sm" variant="outline" icon={Eye} onClick={() => openDetail(m)} className="shrink-0 rounded-xl">View</Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={m.tier ? "brand" : "neutral"}>{m.tier || "Bronze"}</Badge>
                    <AdminStatusBadge status={m.status || "active"} />
                    <AdminStatusBadge status={m.kycStatus || "unverified"} />
                    <span className={scoreBadgeClass(m.socketScore)}>{Number(m.socketScore || 0)} • {r.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="hidden overflow-hidden rounded-2xl border border-[#bdc8f3]/40 bg-white p-0 shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-[#dee3f9]/25 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Socket Score</th>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee3f9]">
                  {members.map((m) => {
                    const id = m._id || m.id;
                    const r = getScoreRating(Number(m.socketScore || 0));
                    return (
                      <tr key={id} className="hover:bg-[#f8faff]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#090f24]">{m.fullName || "Unnamed member"}</p>
                          <p className="font-mono text-[10px] text-text-muted">{id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-secondary">{m.email || "—"}</p>
                          <p className="text-[11px] text-text-muted">{m.phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3"><Badge variant={m.tier ? "brand" : "neutral"}>{m.tier || "Bronze"}</Badge></td>
                        <td className="px-4 py-3"><span className={scoreBadgeClass(m.socketScore)}>{Number(m.socketScore || 0)} • {r.label}</span></td>
                        <td className="px-4 py-3"><AdminStatusBadge status={m.kycStatus || "unverified"} /></td>
                        <td className="px-4 py-3"><AdminStatusBadge status={m.status || "active"} /></td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" icon={Eye} onClick={() => openDetail(m)} className="rounded-xl text-[#3B52C6] hover:bg-[#dee3f9]/40">Inspect</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {!isLoading && !error && members.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#bdc8f3]/30 bg-white px-4 py-3 sm:flex-row">
          <p className="text-xs font-medium text-text-secondary">Page {page} of {totalPages} • {totalCount.toLocaleString()} members</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl">Previous</Button>
            <Button variant="outline" size="sm" icon={ChevronRight} iconPosition="right" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-xl">Next</Button>
          </div>
        </div>
      ) : null}

      {selectedMember ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-3xl flex-col border-l border-[#bdc8f3]/40 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#dee3f9] bg-[#f8faff] p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-extrabold text-[#090f24] sm:text-lg">{member.fullName || "Member details"}</h2>
                  {member.tier ? <Badge variant="brand">{member.tier}</Badge> : null}
                  <AdminStatusBadge status={member.status || selectedMember.status || "active"} />
                </div>
                <p className="mt-0.5 truncate text-xs text-text-secondary">{member.email || selectedMember.email || "—"}</p>
              </div>
              <button type="button" onClick={closeDetail} className="rounded-full p-2 text-text-secondary hover:bg-[#dee3f9]/40" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {detailLoading ? (
                <LoadingState rows={6} />
              ) : detailError ? (
                <ErrorState title="Could not load member details" description={detailError} onRetry={() => loadDetail(selectedMember)} />
              ) : (
                <div className="space-y-4">
                  <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      {String(member.status || "").toLowerCase() === "suspended" ? (
                        <Button size="sm" variant="success" icon={UserCheck} isLoading={busy.activate} onClick={() => runAction("activate", () => activateMember(memberId), "Member activated.")} className="rounded-xl">Activate account</Button>
                      ) : (
                        <Button size="sm" variant="danger" icon={Ban} disabled={busy.suspend} onClick={() => setSuspendTarget(memberId)} className="rounded-xl">Suspend account</Button>
                      )}
                      {kycStatus === "pending_review" ? (
                        <>
                          <Button size="sm" variant="success" icon={Check} isLoading={busy.approve} onClick={() => runAction("approve", () => approveKYC(memberId), "KYC approved.")} className="rounded-xl">Approve KYC</Button>
                          <Button size="sm" variant="outline" icon={X} disabled={busy.reject} onClick={() => { setKycRejectTarget(memberId); setKycRejectReason(""); }} className="rounded-xl">Reject KYC</Button>
                        </>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">Actions are executed against live backend endpoints and may trigger notifications, audit logs, and score updates.</p>
                  </Card>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm"><MemberField label="Net savings" value={formatNaira(netSavings)} /></Card>
                    <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm"><MemberField label="Total withdrawn" value={formatNaira(totalWithdrawn)} /></Card>
                    <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm"><MemberField label="Active loans" value={Number(stats.activeLoansCount || 0).toLocaleString()} /></Card>
                    <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm"><MemberField label="Total loan amount" value={formatNaira(stats.totalLoanAmount || 0)} /></Card>
                  </div>

                  <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm sm:p-5">
                    <h3 className="text-sm font-extrabold text-[#090f24]">Profile information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <MemberField label="Full name" value={member.fullName} />
                      <MemberField label="Email" value={member.email} />
                      <MemberField label="Phone" value={member.phone} />
                      <MemberField label="Member since" value={formatDate(member.createdAt, "PPP")} />
                      <MemberField label="User ID" value={memberId} mono />
                      <MemberField label="Referral code" value={member.referralCode} mono />
                      <MemberField label="KYC status" value={String(kycStatus).replace(/_/g, " ")} />
                      <MemberField label="Socket score" value={`${score} • ${rating.label}`} />
                    </div>
                  </Card>

                  <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm sm:p-5">
                    <h3 className="text-sm font-extrabold text-[#090f24]">Bank & verification</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <MemberField label="Bank" value={member.bankDetails?.bankName || member.bankName} />
                      <MemberField label="Account number" value={member.bankDetails?.accountNumber || member.accountNumber} mono />
                      <MemberField label="Account name" value={member.bankDetails?.accountName || member.accountName} />
                      <MemberField label="BVN" value={member.bvn ? `****${String(member.bvn).slice(-4)}` : "Not provided"} />
                    </div>
                    {member.kycRejectionReason ? (
                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        <p className="font-bold">KYC rejection reason</p>
                        <p className="mt-0.5">{member.kycRejectionReason}</p>
                      </div>
                    ) : null}
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">KYC documents</p>
                      {kycDocs.length === 0 ? (
                        <p className="text-sm text-text-secondary">No KYC documents available.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {kycDocs.map((doc, idx) => {
                            const label = typeof doc === "object" ? (doc.type || doc.label || `Document ${idx + 1}`) : `Document ${idx + 1}`;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="flex items-center gap-2 rounded-xl border border-[#bdc8f3]/40 bg-[#f8faff] p-3 text-left hover:border-[#3B52C6]"
                              >
                                <FileText className="size-4 shrink-0 text-[#3B52C6]" />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-[#090f24]">{String(label).replace(/_/g, " ")}</span>
                                  <span className="block text-xs font-medium text-[#3B52C6]">Preview document</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <ProgressRing progress={Math.max(0, Math.min(100, score))} size={84} strokeWidth={8}>
                          <span className="text-lg font-black text-[#090f24]">{score}</span>
                        </ProgressRing>
                        <div>
                          <p className="text-sm font-extrabold text-[#090f24]">Socket Score</p>
                          <p className="text-xs font-semibold text-text-secondary">{rating.label}</p>
                        </div>
                      </div>
                      <div className="grid flex-1 grid-cols-2 gap-3 text-xs">
                        {Object.entries(member.socketScoreBreakdown || {}).slice(0, 8).map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-[#f8faff] p-2.5">
                            <p className="font-semibold capitalize text-text-secondary">{k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</p>
                            <p className="mt-0.5 font-extrabold text-[#090f24]">{typeof v === "number" ? v : String(v ?? "—")}</p>
                          </div>
                        ))}
                        {!(member.socketScoreBreakdown && Object.keys(member.socketScoreBreakdown).length) ? (
                          <p className="col-span-2 text-sm text-text-secondary">No score breakdown available for this member.</p>
                        ) : null}
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-2xl border border-[#bdc8f3]/40 p-4 shadow-sm sm:p-5">
                    <h3 className="text-sm font-extrabold text-[#090f24]">Recent score history</h3>
                    {scoreHistory.length === 0 ? (
                      <p className="mt-2 text-sm text-text-secondary">No score history records returned.</p>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        {scoreHistory.slice(0, 12).map((item, idx) => {
                          const period = item.period || {};
                          const monthLabel = period.year && period.month
                            ? new Date(period.year, Number(period.month) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                            : formatDate(item.createdAt || item.updatedAt, "MMM yyyy") || `Record ${idx + 1}`;
                          const overall = item.overallScore ?? item.monthlyScore ?? item.cumulativeScore ?? 0;
                          return (
                            <div key={item._id || `${monthLabel}-${idx}`} className="rounded-xl border border-[#dee3f9] bg-[#f8faff] p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-[#090f24]">{monthLabel}</p>
                                  <p className="text-[11px] text-text-secondary">{item.calculationStatus || "Score record"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-[#131e49]">{overall}</p>
                                  <p className="text-[11px] font-semibold text-text-secondary">{getScoreRating(Number(overall || 0)).label}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={async () => {
          const ok = await runAction("suspend", () => suspendMember(suspendTarget, "Admin suspension"), "Member suspended.");
          if (ok) setSuspendTarget(null);
        }}
        title="Suspend member account"
        description="This will suspend the member account via the admin API. The member may lose access until reactivated."
        confirmLabel={busy.suspend ? "Suspending..." : "Suspend member"}
        variant="danger"
        isLoading={busy.suspend}
      />

      {kycRejectTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#bdc8f3]/40 bg-white p-5 shadow-xl">
            <h3 className="text-base font-extrabold text-[#090f24]">Reject KYC submission</h3>
            <p className="text-xs text-text-secondary">Provide a clear reason (minimum 3 characters). The member will be notified.</p>
            <textarea
              className="h-28 w-full rounded-2xl border border-[#bdc8f3]/40 p-3 text-sm text-[#090f24] focus:border-[#131e49] focus:outline-none focus:ring-2 focus:ring-[#131e49]/15"
              placeholder="e.g. ID document is blurry or expired"
              value={kycRejectReason}
              onChange={(e) => setKycRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setKycRejectTarget(null); setKycRejectReason(""); }} disabled={busy.reject} className="rounded-xl">Cancel</Button>
              <Button
                variant="danger"
                isLoading={busy.reject}
                disabled={kycRejectReason.trim().length < 3}
                onClick={async () => {
                  const ok = await runAction("reject", () => rejectKYC(kycRejectTarget, kycRejectReason.trim()), "KYC rejected.");
                  if (ok) { setKycRejectTarget(null); setKycRejectReason(""); }
                }}
                className="rounded-xl"
              >
                Confirm rejection
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {previewDoc ? <KycDocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} /> : null}
    </AdminPageShell>
  );
}

export default AdminMembers;
