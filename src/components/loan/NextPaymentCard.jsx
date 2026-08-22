import { Calendar } from "lucide-react";
import { formatNaira, formatDate } from "@/utils/format";

export function NextPaymentCard({ amount = 50000, dueDate, onPayNow }) {
  return (
    <div className="rounded-2xl bg-[#E8EEFF] p-5 shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center space-y-3">
      {/* Soft Blue Calendar Icon Circle */}
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#7C98EE] text-white shadow-sm">
        <Calendar className="size-6" />
      </div>

      <div className="space-y-0.5">
        <p className="text-xs font-bold text-gray-900">Next Payment</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {formatNaira(amount)}
        </p>
        <p className="text-xs font-semibold text-gray-500">
          {dueDate ? formatDate(dueDate, "dd MMM yyyy") : "19 Jul 2026"}
        </p>
      </div>

      <button
        type="button"
        onClick={onPayNow}
        className="w-full py-3 px-4 rounded-xl bg-[#7C98EE] hover:bg-[#6B88DC] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition-all"
      >
        Pay Now
      </button>
    </div>
  );
}