import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Users,
  Wallet,
  Building2,
  Bell,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import {
  getAdminReports,
  downloadReportPdf,
  downloadReportExcel,
} from "@/services/adminService";
import { formatNaira, formatDate } from "@/utils/format";
import toast from "react-hot-toast";

// ─── TOP HEADER COMPONENT ────────────────────────────────
function AdminHeader({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(query);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between rounded-b-3xl px-4 text-white shadow-md sm:px-6"
      style={{
        background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-[#dee3f9]/70" />
          <input
            type="text"
            placeholder="Search report logs, refs... (Press Enter)"
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
          Audit Live
        </div>

        <button className="relative rounded-full p-2 text-[#dee3f9] hover:bg-white/10 transition-colors">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
}

// ─── MOBILE-OPTIMIZED METRIC CARD ────────────────────────
function MobileReportMetricCard({ icon: Icon, label, value, color = "indigo" }) {
  return (
    <div className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3.5 transition-all hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dee3f9]/40 text-[#131e49]">
        <Icon className="h-5 w-5 text-[#131e49]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-gray-500 truncate leading-tight">
          {label}
        </p>
        <p className="mt-0.5 wrap-break-word text-base font-black tracking-tight text-[#090f24] sm:text-lg">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN ADMIN REPORTS COMPONENT
// ═══════════════════════════════════════════════════════════

export function AdminReports() {
  const [reportType, setReportType] = useState("overview");

  // Dynamic Date Selectors State
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  // Download Loading States
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);

  // Data Fetching
  const { data, isLoading, refetch } = useAsync(
    () => getAdminReports({ type: reportType, month, year }),
    [reportType, month, year]
  );

  // Payload Normalization
  const reportData = data?.data?.reports || data?.reports || data?.data || [];
  const stats = data?.stats || data?.data?.stats || {};
  const totalAmount = data?.totalAmount ?? data?.total ?? stats.totalAmount ?? 0;
  const isOverview = reportType === "overview";

  // Month Options Array
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Year Options Array (Last 5 Years)
  const currentYear = currentDate.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Helper function to trigger browser file download from Blob
  const triggerFileDownload = (blobData, filename) => {
    const blob = new Blob([blobData], {
      type: blobData.type || "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // PDF Export Handler
  async function handleDownloadPdf() {
    setIsPdfDownloading(true);
    try {
      const response = await downloadReportPdf({ type: reportType, month, year });
      const fileBlob = response?.data || response;
      const monthLabel = monthOptions.find((m) => m.value === Number(month))?.label;
      const fileName = `${reportType}-report-${monthLabel}-${year}.pdf`;
      
      triggerFileDownload(fileBlob, fileName);
      toast.success("PDF Report downloaded successfully");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.data?.message || "Failed to download PDF report"
      );
    } finally {
      setIsPdfDownloading(false);
    }
  }

  // Excel Export Handler
  async function handleDownloadExcel() {
    setIsExcelDownloading(true);
    try {
      const response = await downloadReportExcel({ type: reportType, month, year });
      const fileBlob = response?.data || response;
      const monthLabel = monthOptions.find((m) => m.value === Number(month))?.label;
      const fileName = `${reportType}-report-${monthLabel}-${year}.xlsx`;

      triggerFileDownload(fileBlob, fileName);
      toast.success("Excel Report downloaded successfully");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.data?.message || "Failed to download Excel spreadsheet"
      );
    } finally {
      setIsExcelDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#dee3f9]/20 pb-24 font-sans text-[#090f24]">
      {/* ── TOP HEADER ───────────────────────────────────── */}
      <AdminHeader />

      <div className="mx-auto mt-4 w-full max-w-7xl space-y-4 px-4 sm:px-6 pt-1">
        
        {/* Reports Hero Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, #1d2d6d 0%, #131e49 50%, #090f24 100%)",
          }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1 text-[#dee3f9]">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-xs font-semibold">Audit & Compliance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Financial Statements
            </h1>
            <p className="mt-0.5 text-xs text-[#dee3f9]/80">
              Generate, audit, and export organization-wide financial logs and ledgers.
            </p>
          </div>

          {/* Export Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={FileText}
              disabled={isPdfDownloading}
              onClick={handleDownloadPdf}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-bold"
            >
              {isPdfDownloading ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={FileSpreadsheet}
              disabled={isExcelDownloading}
              onClick={handleDownloadExcel}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold border-none"
            >
              {isExcelDownloading ? "Exporting..." : "Export Excel (.xlsx)"}
            </Button>
          </div>
        </div>

        {/* ── FILTERS & SELECTORS ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-[#bdc8f3]/40 shadow-xs">
          {/* Report Type Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["overview", "savings", "loans", "revenue"].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap capitalize ${
                  reportType === type
                    ? "bg-[#131e49] text-white shadow-xs"
                    : "bg-[#dee3f9]/30 text-gray-600 hover:bg-[#dee3f9]/60"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Month/Year Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#dee3f9]/30 border border-[#bdc8f3]/40 rounded-xl px-2.5 py-1.5">
              <Calendar className="size-3.5 text-gray-500" />
              <select
                className="bg-transparent text-xs font-bold text-[#090f24] focus:outline-none"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="bg-[#dee3f9]/30 border border-[#bdc8f3]/40 rounded-xl px-3 py-1.5 text-xs font-bold text-[#090f24] focus:outline-none"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="xs"
              icon={RefreshCw}
              onClick={refetch}
              className="rounded-xl hover:bg-[#dee3f9]/40 p-2"
              title="Refresh Report Data"
            />
          </div>
        </div>

        {/* ── MOBILE-OPTIMIZED SUMMARY STAT CARDS GRID ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MobileReportMetricCard
            label={isOverview ? "Total Portfolio Savings" : `Total ${reportType.toUpperCase()} Volume`}
            value={formatNaira(isOverview ? stats.totalSavings || totalAmount : totalAmount)}
            icon={Wallet}
          />
          <MobileReportMetricCard
            label={isOverview ? "Active Members" : "Total Log Entries"}
            value={
              isOverview
                ? stats.totalMembers?.toLocaleString() || "0"
                : reportData.length?.toLocaleString() || "0"
            }
            icon={Users}
          />
          <MobileReportMetricCard
            label="Total Loans Issued"
            value={formatNaira(stats.totalLoansDisbursed || 0)}
            icon={Building2}
          />
          <MobileReportMetricCard
            label="Cooperative Gross Interest"
            value={formatNaira(stats.totalRevenue || 0)}
            icon={TrendingUp}
          />
        </div>

        {/* ── STATEMENT LEDGER TABLE ─────────────────────── */}
        <Card className="rounded-2xl border border-[#bdc8f3]/40 bg-white p-0 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-[#dee3f9]/30 border-b border-[#dee3f9] flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#090f24] uppercase tracking-wider flex items-center gap-2">
              <FileText className="size-4 text-emerald-600" />
              {reportType} Statement Ledger ({monthOptions.find((m) => m.value === Number(month))?.label} {year})
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-[#bdc8f3]/40">
              {reportData.length} records found
            </span>
          </div>

          {isLoading ? (
            <div className="p-4">
              <LoadingState rows={5} />
            </div>
          ) : reportData.length === 0 ? (
            <EmptyState
              title="No report entries found"
              description={`There are no recorded ${reportType} entries for ${monthOptions.find((m) => m.value === Number(month))?.label} ${year}.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#dee3f9]/20 border-b border-[#dee3f9] text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Member / Reference</th>
                    <th className="px-4 py-3">Category / Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee3f9]">
                  {reportData.map((item, idx) => {
                    const memberName = item.user?.fullName || item.userName || item.member || "System Account";
                    const refCode = item.reference || item.transactionRef || item._id || item.id || `LOG-${idx + 1}`;
                    const category = item.type || item.category || reportType;
                    const amountVal = item.amount || item.principalAmount || item.total || 0;
                    const itemStatus = item.status || "completed";

                    return (
                      <tr key={item._id || item.id || idx} className="hover:bg-[#dee3f9]/10 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                          {formatDate(item.createdAt || item.date || new Date(), "MMM dd, yyyy")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#090f24]">
                          <p>{memberName}</p>
                          <span className="text-[10px] font-mono text-gray-400">{refCode}</span>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-600">
                          <span className="px-2.5 py-0.5 bg-[#dee3f9]/30 rounded-lg border border-[#bdc8f3]/40 font-bold text-[11px] text-[#090f24]">
                            {category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-[#090f24]">
                          {formatNaira(amountVal)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              itemStatus === "completed" || itemStatus === "success" || itemStatus === "approved"
                                ? "success"
                                : itemStatus === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {itemStatus.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}