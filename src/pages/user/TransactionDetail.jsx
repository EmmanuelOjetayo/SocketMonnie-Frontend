import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ReceiptSheet } from "@/components/receipt/ReceiptSheet";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { useAsync } from "@/hooks/useAsync";
import { getTransaction } from "@/services/transactions";
import { buildReceiptData } from "@/utils/receiptData";
import { formatNaira } from "@/utils/format";
import { cn } from "@/utils/cn";

/**
 * Transaction details.
 *
 * The record is fetched from the backend (GET /api/transactions/:id), so a
 * deep link, a shared link or a page refresh all resolve the same
 * server-side record — and a member can only ever load their own.
 *
 * The screen shows the transaction the way established fintech apps do:
 * the state and the amount first, the details underneath, and the receipt
 * one tap away.
 */

const STATUS_THEME = {
  successful: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Icon: CheckCircle2,
    accent: "text-emerald-600",
    label: "Successful",
  },
  pending: {
    pill: "bg-amber-50 text-amber-700 border-amber-100",
    Icon: Clock3,
    accent: "text-amber-600",
    label: "Pending",
  },
  failed: {
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    Icon: XCircle,
    accent: "text-rose-600",
    label: "Failed",
  },
};

export function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { data, isLoading, error } = useAsync(
    () => getTransaction(id),
    [id]
  );

  const transaction = data?.transaction || data?.data?.transaction || null;

  const receipt = useMemo(
    () => (transaction ? buildReceiptData(transaction) : null),
    [transaction]
  );

  const theme = STATUS_THEME[receipt?.status] || STATUS_THEME.pending;
  const StatusIcon = theme.Icon;

  const dateLabel = receipt?.occurredAtLabel || null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#dee3f9]/20 pb-10 font-sans text-[#090f24]">
      {/* HEADER */}
      <header
        className="relative px-4 pb-6 pt-3 text-white shadow-lg"
        style={{
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-sm font-bold tracking-tight">Transaction details</h1>
          <div className="size-9" />
        </div>
      </header>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            <LoadingState rows={2} />
            <LoadingState rows={4} />
          </div>
        ) : error || !transaction ? (
          <EmptyState
            title="Transaction not found"
            description={
              error?.message ||
              "We could not find this transaction in your account records."
            }
          />
        ) : (
          <>
            {/* HERO */}
            <section className="rounded-3xl border border-[#bdc8f3]/40 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                    theme.pill
                  )}
                >
                  <StatusIcon className="size-3.5" />
                  {receipt?.statusLabel || theme.label}
                </span>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[11px] font-semibold text-[#6b7280]">
                  {receipt?.direction === "debit" ? "Amount debited" : "Amount received"}
                </p>
                <p className="mt-1 text-[32px] font-black leading-none tracking-tight text-[#090f24]">
                  {formatNaira(receipt?.amount ?? transaction.amount, { decimals: 2 })}
                </p>
                <p className="mt-2 text-xs font-bold text-[#3557d4]">
                  {transaction.label || receipt?.typeLabel}
                </p>
                {dateLabel && (
                  <p className="mt-1 text-[11px] font-medium text-[#9ca3af]">
                    {dateLabel}
                  </p>
                )}
              </div>
            </section>

            {/* DETAILS */}
            <section className="mt-3 rounded-2xl border border-[#bdc8f3]/40 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <StatusIcon className={cn("size-4", theme.accent)} />
                <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-[#090f24]">
                  Transaction details
                </h2>
              </div>

              <dl className="divide-y divide-[#eef1fd]">
                {(receipt?.rows || []).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 py-2.5"
                  >
                    <dt className="shrink-0 text-[11px] font-semibold text-[#6b7280]">
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        "max-w-[62%] break-words text-right text-[11px] font-bold text-[#090f24]",
                        row.mono && "font-mono text-[10px]",
                        row.emphasis && "text-[13px] font-black",
                        row.status === "successful" && "text-emerald-600",
                        row.status === "pending" && "text-amber-600",
                        row.status === "failed" && "text-rose-600"
                      )}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ACTIONS */}
            {receipt && (
              <section className="mt-3">
                <ReceiptActions
                  data={receipt}
                  onViewReceipt={() => setIsReceiptOpen(true)}
                />
              </section>
            )}
          </>
        )}
      </div>

      <ReceiptSheet
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receipt}
      />
    </div>
  );
}
