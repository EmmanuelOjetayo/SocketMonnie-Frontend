import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Download, Share2, Clock3 } from "lucide-react";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

export  function WithdrawalSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    amount = 0,
    fee = 100,
    totalDeducted = Number(amount || 0) + Number(fee || 0),
    status = "pending_approval",
    destinationBank = {},
    reference = `WTH_REQ_${Date.now()}`,
    date = new Date().toISOString(),
  } = state || {};

  const {
    bankName = "Bank Account",
    accountName = "N/A",
    accountNumber = "N/A",
  } = destinationBank;

  const formattedDate = new Date(date).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const isPending =
    status === "pending_approval" ||
    status === "pending" ||
    !status;

  const transactionDetails = [
    {
      id: "amount",
      label: "Amount",
      value: formatNaira(amount, { decimals: 2 }),
      valueStyle: "font-black text-gray-900 text-sm",
    },
    {
      id: "status",
      label: "Status",
      value: isPending ? "Pending Approval" : "Processing",
      valueStyle: "font-bold text-amber-600 text-sm",
    },
    {
      id: "fee",
      label: "Withdrawal fee",
      value: formatNaira(fee, { decimals: 2 }),
      valueStyle: "font-black text-gray-900 text-sm",
    },
    {
      id: "total",
      label: "Total deduction",
      value: formatNaira(totalDeducted, { decimals: 2 }),
      valueStyle: "font-black text-gray-900 text-sm",
    },
    {
      id: "destinationBank",
      label: "Destination Bank",
      value: bankName,
      valueStyle: "font-extrabold text-gray-900 text-xs",
    },
    {
      id: "accountName",
      label: "Account Name",
      value: accountName,
      valueStyle: "font-extrabold text-gray-900 text-xs",
    },
    {
      id: "accountNumber",
      label: "Account Number",
      value: accountNumber,
      valueStyle: "font-extrabold text-gray-900 text-xs",
    },
    {
      id: "dateTime",
      label: "Date & Time",
      value: formattedDate,
      valueStyle: "font-bold text-gray-900 text-xs",
    },
    {
      id: "referenceId",
      label: "Reference ID",
      value: reference,
      valueStyle: "font-bold text-gray-900 text-xs",
    },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50/60 px-4 py-8 font-sans text-gray-900">
      {/* Status */}
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div
            className="absolute inset-0 bg-amber-500"
            style={{
              clipPath:
                "polygon(50% 0%, 63% 5%, 75% 2%, 84% 10%, 93% 15%, 95% 27%, 100% 38%, 97% 50%, 100% 62%, 95% 73%, 93% 85%, 84% 90%, 75% 98%, 63% 95%, 50% 100%, 37% 95%, 25% 98%, 16% 90%, 7% 85%, 5% 73%, 0% 62%, 3% 50%, 0% 38%, 5% 27%, 7% 15%, 16% 10%, 25% 2%, 37% 5%)",
            }}
          />

          <Clock3 className="relative h-10 w-10 text-white stroke-[2.5]" />
        </div>

        <div className="mt-4 space-y-1">
          <h1 className="text-xl font-extrabold tracking-tight">
            Withdrawal Request Submitted
          </h1>

          <p className="text-2xl font-black tracking-tight">
            {formatNaira(amount, { decimals: 2 })}
          </p>

          <p className="mx-auto max-w-[280px] text-xs font-medium leading-relaxed text-gray-600">
            Your withdrawal request has been submitted successfully and is
            waiting for admin approval.
          </p>
        </div>
      </div>

      {/* Pending Notice */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock3 className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs font-extrabold text-amber-900">
              Pending Admin Approval
            </p>

            <p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-800">
              Your savings have been submitted for withdrawal. The payout
              will be processed after the request is reviewed and approved.
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-5 space-y-3.5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {transactionDetails.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="shrink-0 font-bold text-gray-900">
              {item.label}
            </span>

            <div
              className={`max-w-[60%] break-words text-right ${item.valueStyle}`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-3 pb-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.SAVINGS)}
          className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
        >
          Back to Savings
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
          >
            <Download className="h-4 w-4 text-gray-700" />
            Download Receipt
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-gray-700" />
            Share Receipt
          </button>
        </div>
      </div>
    </div>
  );
}