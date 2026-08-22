import * as React from "react";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500",
  secondary:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 focus-visible:ring-brand-500",
  success:
    "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-surface-alt active:bg-surface focus-visible:ring-brand-500",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-alt active:bg-surface focus-visible:ring-brand-500",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:ring-danger-500",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-control",
  md: "h-12 px-5 text-[15px] rounded-control",
  lg: "h-14 px-6 text-base rounded-control",
};

// Scaled icon sizes to match standard Figma layout grids perfectly
const ICON_SIZES = {
  sm: "size-4",
  md: "size-4.5", // 18px
  lg: "size-5",   // 20px
};

/**
 * Figma-aligned Base Button.
 * Handles primary, secondary, loading, disabled, and icon states seamlessly.
 */
export const Button = React.forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    disabled = false,
    icon: Icon,
    iconPosition = "left",
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const iconClass = ICON_SIZES[size] || "size-4";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        // Base layout & interaction traits
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 ease-in-out select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        // Variant & Size mappings
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className={cn("animate-spin", iconClass)} />
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon className={cn("shrink-0", iconClass)} />
          )}
          {children && <span>{children}</span>}
          {Icon && iconPosition === "right" && (
            <Icon className={cn("shrink-0", iconClass)} />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";