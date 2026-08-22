import { Calendar } from "lucide-react";
import { formatNaira, formatDate } from "@/utils/format";

export function RecentLoanApplications({ history = [] }) {
  const fallbackApplications = [
    {
      _id: "1",
      loanType: "Cooperative Loan",
      createdAt: "2026-07-04",
      amount: 10000,
      status: "Approved",
    },
    {
      _id: "2",
      loanType: "Emergency Loan",
      createdAt: "2026-07-20",
      amount: 5000,
      status: "Declined",
    },
  ];

  const applications = history.length > 0 ? history.slice(0, 3) : fallbackApplications;

  return (
    <div className="space-y-2.5">
      {applications.map((app) => {
        const isApproved = app.status?.toLowerCase() === "approved";
        const isDeclined = app.status?.toLowerCase() === "declined";

        return (
          <div
            key={app._id}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex size-11 items-center justify-center rounded-2xl ${
                  isDeclined ? "bg-rose-50 text-rose-500" : "bg-[#E8F8F0] text-[#10B981]"
                }`}
              >
                <Calendar className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 leading-snug">
                  {app.loanType || "Cooperative Loan"}
                </h4>
                <p className="text-[11px] text-gray-400 font-medium">
                  Applied on {formatDate(app.createdAt || app.appliedAt, "d MMMM yyyy")}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-black text-gray-900">
                {formatNaira(app.amount || app.principalAmount)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isApproved
                    ? "bg-[#E8F8F0] text-[#10B981]"
                    : isDeclined
                    ? "bg-rose-50 text-rose-500"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : "Pending"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}