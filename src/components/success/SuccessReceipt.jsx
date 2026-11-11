import { useMemo } from "react";

import { Button } from "@/components/ui/Button";
import { TransactionReceipt } from "@/components/receipt/TransactionReceipt";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { receiptDataFromDetails } from "@/utils/receiptData";
import { cn } from "@/utils/cn";

/**
 * Payment receipt used by every payment success page.
 *
 * It renders the shared `TransactionReceipt` component, so the receipt a
 * member sees after a payment is pixel-identical to the receipt they open
 * from their transaction history — same branding, same rows, same PDF.
 *
 * Status handling (unchanged, and deliberately strict):
 *  - "successful"  → green treatment, details as given
 *  - "pending" / "processing" → amber treatment; never a fabricated success
 *  - "failed" / "not_found"  → red treatment
 *
 * When `receipt` is supplied (the canonical model built from the
 * backend-confirmed transaction), the shared download/share actions are
 * rendered beneath the page actions.
 */
export function SuccessReceipt({
  title,
  amount,
  subtitle,
  details = [],
  actions = [],
  status = "successful",
  receipt,
  className,
}) {
  const data = useMemo(
    () =>
      receipt ||
      receiptDataFromDetails({ title, amount, subtitle, details, status }),
    [receipt, title, amount, subtitle, details, status]
  );

  return (
    <div className={cn("px-5 pb-8", className)}>
      <TransactionReceipt data={data} />

      {subtitle && (
        <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-gray-500">
          {subtitle}
        </p>
      )}

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="mt-6 space-y-2.5">
          {actions.map(({ label, onClick, variant = "primary", icon: Icon }) => (
            <Button
              key={label}
              fullWidth
              size="md"
              variant={variant}
              icon={Icon}
              onClick={onClick}
              className={cn(
                "rounded-xl py-3 text-xs font-bold transition-all shadow-sm",
                variant === "primary" && "bg-[#3557d4] hover:bg-[#2845b5] text-white"
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      {receipt && (
        <ReceiptActions data={receipt} showView={false} layout="row" className="mt-3" />
      )}
    </div>
  );
}
