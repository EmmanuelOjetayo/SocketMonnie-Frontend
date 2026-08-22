import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/utils/format";
import { cn } from "@/utils/cn";

export function SuccessReceipt({
  title,
  amount,
  subtitle,
  details = [],
  actions = [],
  className,
}) {
  return (
    <div className={cn("px-5 pb-8", className)}>
      <div className="flex flex-col items-center text-center pt-4">
        
        {/* Animated Green Scalloped Success Badge */}
        <div className="relative flex items-center justify-center animate-in zoom-in-50 duration-500 ease-out">
          <svg
            className="size-24 text-[#12b76a] drop-shadow-sm transition-transform duration-300"
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

        {/* Title, Amount, Subtitle */}
        <h2 className="mt-5 text-xl font-extrabold text-[#090f24]">{title}</h2>
        <p className="text-2xl font-black text-[#090f24] mt-1">{formatNaira(amount)}</p>
        {subtitle && <p className="mt-1 text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>

      {/* Details Card */}
      <Card className="mt-6 rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden p-4">
        <div className="divide-y divide-gray-100">
          {details.map(({ label, value, highlight = false }) => {
            const isStatus = label?.toLowerCase() === "status";
            const isSuccessStatus = isStatus && value?.toLowerCase() === "successful";

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