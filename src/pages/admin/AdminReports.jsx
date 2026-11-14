import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, FileText, Calendar, RefreshCw, TrendingUp, Users, Wallet, Building2, BarChart3 } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { getAdminReports, downloadReportPdf, downloadReportExcel } from "@/services/adminService";
import { formatNaira, formatDate } from "@/utils/format";
import { AdminPageShell, AdminHero, AdminStatCard, AdminStatusBadge } from "@/components/admin";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

function triggerFileDownload(blobData, filename) {
  if (!(blobData instanceof Blob)) throw new Error("Export file is not available.");
  const url = window.URL.createObjectURL(blobData);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function AdminReports() {
  const now = new Date();
  const [reportType, setReportType] = useState("overview");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);

  const { data, isLoading, error, refetch } = useAsync(
    () => getAdminReports({ type: reportType, month, year }),
    [reportType, month, year]
  );

  const stats = data?.stats || data?.data?.stats || {};
  const reportData = Array.isArray(data?.reports) ? data.reports : Array.isArray(data?.data?.reports) ? data.data.reports : Array.isArray(data?.data) ? data.data : [];
  const totalAmount = data?.totalAmount ?? stats.totalAmount ?? 0;
  const isOverview = reportType === "overview";
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i), [now]);

  async function handleDownload(kind) {
    const isPdf = kind === "pdf";
    const setLoading = isPdf ? setIsPdfDownloading : setIsExcelDownloading;
    setLoading(true);
    try {
      const response = isPdf
        ? await downloadReportPdf({ type: reportType, month, year })
        : await downloadReportExcel({ type: reportType, month, year });
      const fileBlob = response?.data instanceof Blob ? response.data : response instanceof Blob ? response : null;
      if (!fileBlob) throw new Error(isPdf ? "PDF export is not available right now." : "Excel export is not available right now.");
      const monthLabel = MONTHS.find((m) => m.value === Number(month))?.label || month;
      const ext = isPdf ? "pdf" : "xlsx";
      triggerFileDownload(fileBlob, `${reportType}-report-${monthLabel}-${year}.${ext}`);
      toast.success(`${isPdf ? "PDF" : "Excel"} report downloaded.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || `${isPdf ? "PDF" : "Excel"} export is not available yet.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPageShell>
      <AdminHero
        icon={BarChart3}
        eyebrow="Audit & Compliance"
        title="Reports & Statements"
        description="View cooperative report snapshots and ledger entries from live backend data. Export availability depends on backend support."
        actions={
          <>
            <Button variant="outline" size="sm" icon={FileText} disabled={isPdfDownloading} onClick={() => handleDownload("pdf")} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
              {isPdfDownloading ? "Exporting..." : "Export PDF"}
            </Button>
            <Button variant="outline" size="sm" icon={FileSpreadsheet} disabled={isExcelDownloading} onClick={() => handleDownload("excel")} className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20">
              {isExcelDownloading ? "Exporting..." : "Export Excel"}
            </Button>
          </>
        }
      />

      <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "overview", label: "Overview" },
              { key: "savings", label: "Savings" },
              { key: "loans", label: "Loans" },
              { key: "revenue", label: "Revenue" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setReportType(t.key)}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${reportType === t.key ? "bg-[#131e49] text-white" : "bg-[#dee3f9]/35 text-[#32417B] hover:bg-[#dee3f9]/60"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[#bdc8f3]/40 bg-[#f8faff] px-2.5 py-1.5">
              <Calendar className="size-4 text-text-secondary" />
              <select className="bg-transparent text-xs font-bold text-[#090f24] focus:outline-none" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="bg-transparent text-xs font-bold text-[#090f24] focus:outline-none" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={refetch} className="rounded-xl">Refresh</Button>
          </div>
        </div>
        {!isOverview ? (
          <p className="mt-2 text-[11px] font-medium text-amber-700">Note: date filters are sent to the API, but period-specific filtering depends on backend report support.</p>
        ) : null}
      </Card>

      {isLoading ? (
        <LoadingState rows={5} />
      ) : error ? (
        <ErrorState
          title="Could not load reports"
          description={error?.data?.message || error?.message || "Report data is unavailable right now."}
          onRetry={refetch}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard icon={Wallet} label={isOverview ? "Total Savings" : `Total ${reportType} volume`} value={formatNaira(isOverview ? (stats.totalSavings || totalAmount || 0) : (totalAmount || 0))} tone="brand" />
            <AdminStatCard icon={Users} label={isOverview ? "Total Members" : "Report Entries"} value={isOverview ? Number(stats.totalMembers || 0).toLocaleString() : Number(reportData.length || 0).toLocaleString()} tone="brand" />
            <AdminStatCard icon={Building2} label="Loans Disbursed" value={formatNaira(stats.totalLoansDisbursed || 0)} tone="brand" />
            <AdminStatCard icon={TrendingUp} label="Gross Revenue / Interest" value={formatNaira(stats.totalRevenue || 0)} tone="success" />
          </div>

          {isOverview ? (
            <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#090f24]">Overview snapshot</h3>
              <p className="mt-1 text-sm text-text-secondary">This view shows aggregate metrics from the backend overview report. Switch to Savings, Loans, or Revenue to inspect ledger entries when available.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-2xl border border-[#bdc8f3]/40 bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#dee3f9] bg-[#f8faff] px-4 py-3">
                <h3 className="text-sm font-extrabold text-[#090f24] capitalize">{reportType} entries</h3>
                <span className="rounded-full border border-[#bdc8f3]/40 bg-white px-2.5 py-0.5 text-[11px] font-bold text-text-secondary">{reportData.length} record(s)</span>
              </div>
              {reportData.length === 0 ? (
                <EmptyState title="No entries found" description="No records were returned for this report type." className="py-10" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-[#dee3f9]/20 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Member / Reference</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dee3f9]">
                      {reportData.map((item, idx) => {
                        const memberName = item.user?.fullName || item.userId?.fullName || item.userName || item.member || "—";
                        const ref = item.reference || item.transactionRef || item._id || item.id || `row-${idx + 1}`;
                        const type = String(item.type || item.category || reportType).replace(/_/g, " ");
                        const amount = item.amount ?? item.principalAmount ?? item.total ?? 0;
                        const status = item.status || "completed";
                        return (
                          <tr key={item._id || item.id || idx} className="hover:bg-[#f8faff]">
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-text-secondary">{formatDate(item.createdAt || item.date || item.updatedAt, "MMM dd, yyyy") || "—"}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#090f24]">{memberName}</p>
                              <p className="max-w-[220px] truncate font-mono text-[10px] text-text-muted" title={String(ref)}>{String(ref)}</p>
                            </td>
                            <td className="px-4 py-3 capitalize text-text-secondary">{type}</td>
                            <td className="whitespace-nowrap px-4 py-3 font-extrabold text-[#090f24]">{formatNaira(amount)}</td>
                            <td className="px-4 py-3"><AdminStatusBadge status={status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </AdminPageShell>
  );
}

export default AdminReports;
