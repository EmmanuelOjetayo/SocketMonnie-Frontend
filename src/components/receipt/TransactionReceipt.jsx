import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatNaira } from "@/utils/format";
import { cn } from "@/utils/cn";

/**
 * The SocketMonnie payment receipt.
 *
 * ONE component renders every receipt in the product — success pages,
 * transaction history, the detail screen and the PDF export all render
 * this exact markup, so a receipt always looks the same wherever a member
 * opens it.
 *
 * It renders a CANONICAL receipt model (see utils/receiptData). The status
 * is never assumed: a receipt only shows the green "Successful" treatment
 * when the backend record says the transaction is successful.
 */

const STATUS_THEME = {
  successful: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
    Icon: CheckCircle2,
    accent: "text-emerald-600",
  },
  pending: {
    pill: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
    Icon: Clock3,
    accent: "text-amber-600",
  },
  failed: {
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
    Icon: XCircle,
    accent: "text-rose-600",
  },
};

export function TransactionReceipt({ data, className, showFooter = true }) {
  if (!data) return null;

  const theme = STATUS_THEME[data.status] || STATUS_THEME.pending;
  const StatusIcon = theme.Icon;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-[#dee3f9] bg-white shadow-[0_18px_40px_-24px_rgba(9,15,36,0.45)]",
        className
      )}
    >
      {/* BRAND HEADER */}
      <div
        className="px-5 pb-6 pt-5 text-white"
        style={{
          background: "linear-gradient(180deg, #1d2d6d 0%, #131e49 60%, #090f24 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              SocketMonnie
            </p>
            <p className="mt-0.5 text-sm font-bold tracking-tight text-white">
              Payment Receipt
            </p>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              theme.pill
            )}
          >
            <span className={cn("size-1.5 rounded-full", theme.dot)} />
            {data.statusLabel}
          </span>
        </div>

        {/* AMOUNT */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold text-white/60">
            {data.direction === "debit" ? "Amount debited" : "Amount received"}
          </p>
          <p className="mt-1 text-[30px] font-black leading-none tracking-tight text-white">
            {formatNaira(data.amount, { decimals: 2 })}
          </p>
          <p className="mt-2 text-xs font-semibold text-white/90">{data.typeLabel}</p>
          {data.occurredAtLabel && (
            <p className="mt-0.5 text-[11px] font-medium text-white/60">
              {data.occurredAtLabel}
            </p>
          )}
        </div>
      </div>

      {/* DETAILS */}
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2">
          <StatusIcon className={cn("size-4", theme.accent)} />
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#090f24]">
            Transaction details
          </p>
        </div>

        <dl className="divide-y divide-[#eef1fd]">
          {data.rows.map((row) => (
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
                  row.mono && "font-mono text-[10px] tracking-tight",
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
      </div>

      {showFooter && (
        <div className="border-t border-[#eef1fd] bg-[#f7f9ff] px-5 py-3">
          <p className="text-[10px] font-medium leading-relaxed text-[#6b7280]">
            {data.note} This receipt was generated from your SocketMonnie
            account records.
          </p>
          {data.reference && (
            <p className="mt-1 break-all font-mono text-[9px] font-semibold text-[#9ca3af]">
              {data.reference}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
