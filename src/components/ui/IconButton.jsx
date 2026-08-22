import { cn } from "@/utils/cn";

export function IconButton({ icon: Icon, label, className, variant = "ghost", size = "md", ...props }) {
  const sizes = { sm: "size-8", md: "size-10", lg: "size-12" };
  const variants = {
    ghost: "bg-transparent hover:bg-surface-alt text-text-primary",
    filled: "bg-surface-alt text-text-primary hover:bg-border",
    brand: "bg-brand-50 text-brand-600 hover:bg-brand-100",
  };
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      <Icon className="size-[45%]" />
    </button>
  );
}