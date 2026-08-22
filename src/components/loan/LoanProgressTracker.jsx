import { Card } from "@/components/ui/Card";
import { formatNaira, formatDate } from "@/utils/format";
import { Calendar } from "lucide-react";

export function LoanProgressTracker({ loan }) {
  if (!loan) return null;

  const installments = loan.installments || [];
  const totalInstallments = installments.length || 1;
  const paidInstallments = installments.filter(i => i.status === "paid").length;
  const progressPercent = Math.round((paidInstallments / totalInstallments) * 100);

  const next = installments.find(i => i.status !== "paid");
  const daysLeft = next 
    ? Math.ceil((new Date(next.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className="p-5 space-y-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Payments Completed</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black text-[#10B981]">{paidInstallments}</span>
          <span className="text-xs font-semibold text-gray-400">of {totalInstallments}</span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#10B981] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">On-Time</p>
          <p className="text-base font-bold text-[#10B981] mt-1">{paidInstallments}</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">Next Due</p>
          <p className="text-base font-bold text-gray-900 mt-1">
            {next ? formatNaira(next.amountDue) : formatNaira(0)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <p className="text-gray-400 font-medium">Progress</p>
          <p className="text-base font-bold text-[#10B981] mt-1">{progressPercent}%</p>
        </div>
      </div>

      {next && (
        <div className="rounded-xl bg-[#E8F8F0] border border-[#10B981]/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[#10B981]" />
              <span className="text-sm font-bold text-[#10B981]">
                {formatDate(next.dueDate, "MMM dd, yyyy")}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${daysLeft > 0 ? "bg-[#10B981]/20 text-[#10B981]" : "bg-rose-100 text-rose-600"}`}>
              {daysLeft > 0 ? `${daysLeft} Days Left` : "Overdue"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}