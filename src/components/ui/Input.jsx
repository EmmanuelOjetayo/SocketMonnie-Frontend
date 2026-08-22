import { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff } from "lucide-react";

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, type = "text", className, containerClassName, ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
        )}
        <input
          ref={ref}
          type={resolvedType}
          className={cn(
            "h-12 w-full rounded-control border bg-card px-4 text-[15px] text-text-primary placeholder:text-text-muted",
            "border-border focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
            Icon && "pl-11",
            isPassword && "pr-11",
            error && "border-danger-500 focus:border-danger-500 focus:ring-danger-100",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger-500">{error}</p>}
    </div>
  );
});