import { Download, Share2 } from "lucide-react";
import SuccessBadge from "./SuccessBadge";
import ReceiptCard from "./ReceiptCard";

/**
 * Shared success/result screen shell:
 *   centered starburst seal, title, amount, subtitle, receipt rows, and the
 *   primary action + receipt actions at the bottom.
 *
 * This component is purely presentational. Callers own the state polling and
 * choose which actions to render (pass the primary action explicitly, and the
 * receipt actions via onDownload/onShare when a confirmed receipt exists).
 */
export default function TransactionSuccessLayout({
  title,
  amount,
  subtitle,
  rows = [],
  primaryLabel = "Back to Savings",
  primaryActions = [], // [{ label, onClick, variant? }] — overrides the single primary button
  onPrimary,
  showReceiptActions = true,
  onDownload,
  onShare,
  tone = "success",
}) {
  const handleDownload = onDownload ?? (() => window.print());

  const handleShare =
    onShare ??
    (async () => {
      const text = `${title} - ${amount}`;
      try {
        if (navigator.share) await navigator.share({ title, text });
        else await navigator.clipboard.writeText(text);
      } catch {
        // user cancelled share
      }
    });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center bg-[#F7F8FB] px-4 pb-8 pt-16 font-sans print:bg-white print:pt-4">
      <SuccessBadge tone={tone} />

      <h1 className="mt-7 text-[15px] font-bold text-gray-900">{title}</h1>
      <p className="mt-1.5 text-[22px] font-extrabold tracking-tight text-gray-900">
        {amount}
      </p>
      {subtitle && (
        <p className="mt-1.5 max-w-[240px] text-center text-[11px] leading-relaxed text-gray-600">
          {subtitle}
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 w-full">
          <ReceiptCard rows={rows} />
        </div>
      )}

      <div className="mt-auto flex w-full flex-col items-center gap-4 pt-10">
        <div className="flex w-full flex-col gap-2.5">
          {primaryActions.length > 0 ? (
            primaryActions.map(({ label, onClick, variant = "primary" }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={
                  variant === "outline"
                    ? "w-full rounded-lg border border-gray-200 bg-white py-3 text-[13px] font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
                    : "w-full rounded-lg bg-[#3B5BDB] py-3 text-[13px] font-semibold text-white transition hover:bg-[#364fc7] active:scale-[0.98]"
                }
              >
                {label}
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={onPrimary}
              className="rounded-lg bg-[#3B5BDB] px-7 py-3 text-[13px] font-semibold text-white transition hover:bg-[#364fc7] active:scale-[0.98]"
            >
              {primaryLabel}
            </button>
          )}
        </div>

        {showReceiptActions && (
          <div className="flex w-full gap-3 print:hidden">
            <button
              type="button"
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-[11px] font-medium text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <Download size={14} /> Download Receipt
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-[11px] font-medium text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:bg-gray-50 active:scale-[0.98]"
            >
              <Share2 size={14} /> Share Receipt
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
