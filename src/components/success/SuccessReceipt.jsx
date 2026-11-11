import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/utils/format";
import { cn } from "@/utils/cn";

const STATUS_STYLES = {
  successful: { badge: "text-[#12b76a]", title: "text-[#090f24]" },
  processing: { badge: "text-amber-500", title: "text-[#090f24]" },
  pending: { badge: "text-amber-500", title: "text-[#090f24]" },
  failed: { badge: "text-[#f04438]", title: "text-[#090f24]" },
  not_found: { badge: "text-[#f04438]", title: "text-[#090f24]" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.successful;

  if (status === "successful") {
    return (
      <div className="relative flex items-center justify-center animate-in zoom-in-50 duration-500 ease-out">
        <svg
          className={cn("size-24 drop-shadow-sm transition-transform duration-300", style.badge)}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          {/* 12-point Scalloped Star Background */}
          <path d="M50 0 L58.5 6.7 L69.1 3.8 L74.7 13.2 L85.7 13.5 L88.2 24.2 L97.7 29.8 L96.8 40.8 L100 50 L96.8 59.2 L97.7 70.2 L88.2 75.8 L85.7 86.5 L74.7 86.8 L69.1 96.2 L58.5 93.3 L50 100 L41.5 93.3 L30.9 96.2 L25.3 86.8 L14.3 86.5 L11.8 75.8 L2.3 70.2 L3.2 59.2 L0 50 L3.2 40.8 L2.3 29.8 L11.8 24.2 L14.3 13.5 L25.3 13.2 L30.9 3.8 L41.5 6.7 Z" />
          {/* Animated Inner Checkmark */}
          <path
            d="M32 50 L44 62 L68 38"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-in fade-in duration-700 delay-150"
          />
        </svg>
      </div>
    );
  }

  if (status === "failed" || status === "not_found") {
    return (
      <div className="relative flex items-center justify-center animate-in zoom-in-50 duration-500 ease-out">
        <svg
          className={cn("size-24 drop-shadow-sm transition-transform duration-300", style.badge)}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 0 L58.5 6.7 L69.1 3.8 L74.7 13.2 L85.7 13.5 L88.2 24.2 L97.7 29.8 L96.8 40.8 L100 50 L96.8 59.2 L97.7 70.2 L88.2 75.8 L85.7 86.5 L74.7 86.8 L69.1 96.2 L58.5 93.3 L50 100 L41.5 93.3 L30.9 96.2 L25.3 86.8 L14.3 86.5 L11.8 75.8 L2.3 70.2 L3.2 59.2 L0 50 L3.2 40.8 L2.3 29.8 L11.8 24.2 L14.3 13.5 L25.3 13.2 L30.9 3.8 L41.5 6.7 Z" />
          <path
            d="M36 36 L64 64 M64 36 L36 64"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            className="animate-in fade-in duration-700 delay-150"
          />
        </svg>
      </div>
    );
  }

  // pending / processing / any non-terminal state: amber hourglass
  return (
    <div className="relative flex items-center justify-center animate-in zoom-in-50 duration-500 ease-out">
      <svg
        className={cn("size-24 drop-shadow-sm transition-transform duration-300", style.badge)}
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 0 L58.5 6.7 L69.1 3.8 L74.7 13.2 L85.7 13.5 L88.2 24.2 L97.7 29.8 L96.8 40.8 L100 50 L96.8 59.2 L97.7 70.2 L88.2 75.8 L85.7 86.5 L74.7 86.8 L69.1 96.2 L58.5 93.3 L50 100 L41.5 93.3 L30.9 96.2 L25.3 86.8 L14.3 86.5 L11.8 75.8 L2.3 70.2 L3.2 59.2 L0 50 L3.2 40.8 L2.3 29.8 L11.8 24.2 L14.3 13.5 L25.3 13.2 L30.9 3.8 L41.5 6.7 Z" />
        {/* Hourglass */}
        <path
          d="M35 30 H65 M35 70 H65 M38 30 C38 44 50 44 50 50 C50 56 62 56 62 70 M62 30 C62 44 50 44 50 50 C50 56 38 56 38 70"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-in fade-in duration-700 delay-150"
        />
      </svg>
    </div>
  );
}

/**
 * Payment receipt. `status` controls the badge and how details render:
 *  - "successful"  → green check, details as given (only show after backend confirmation)
 *  - "pending" / "processing" → amber hourglass; never display a fabricated success
 *  - "failed" / "not_found"  → red cross
 * Backward-compatible: default status is "successful".
 */
export function SuccessReceipt({
  title,
  amount,
  subtitle,
  details = [],
  actions = [],
  status = "successful",
  className,
}) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.successful;
  const isSuccess = status === "successful";

  return (
    <div className={cn("px-5 pb-8", className)}>
      <div className="flex flex-col items-center text-center pt-4">
        <StatusBadge status={status} />

        {/* Title, Amount, Subtitle */}
        <h2 className={cn("mt-5 text-xl font-extrabold", style.title)}>{title}</h2>
        <p className="text-2xl font-black text-[#090f24] mt-1">{formatNaira(amount)}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>

      {/* Details Card */}
      <Card className="mt-6 rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden p-4">
        <div className="divide-y divide-gray-100">
          {details.map(({ label, value, highlight = false }) => {
            const isStatus = label?.toLowerCase() === "status";
            const isSuccessStatus = isStatus && String(value || "").toLowerCase() === "successful";

            return (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between py-2.5 text-xs font-semibold",
                  highlight && "font-bold text-[#3557d4]"
                )}
              >
                <span className="text-gray-900">{label}</span>
                <span
                  className={cn(
                    "text-gray-900",
                    isSuccessStatus && "text-[#12b76a] font-bold",
                    isStatus && String(value || "").toLowerCase() === "failed" && "text-[#f04438] font-bold",
                    isStatus && String(value || "").toLowerCase() === "pending" && "text-amber-600 font-bold",
                    highlight && "text-[#3557d4]"
                  )}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

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
    </div>
  );
}
