import { Card } from "@/components/ui/Card";
import { formatNaira, formatDate } from "@/utils/format";

export function PaymentSchedule({ installments = [] }) {
  if (!installments || installments.length === 0) {
    return (
      <Card className="p-6 text-center text-xs font-semibold text-gray-400 rounded-2xl">
        No payment schedule available
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {installments.map((inst, index) => {
              const isPaid = inst.status === "paid";
              return (
                <tr key={inst.installmentNumber || index} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-900">{inst.installmentNumber || index + 1}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inst.dueDate)}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatNaira(inst.amountDue)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPaid ? "bg-[#E8F8F0] text-[#10B981]" : "bg-amber-50 text-amber-600"
                    }`}>
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}