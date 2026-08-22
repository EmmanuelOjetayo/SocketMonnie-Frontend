import { cn } from "@/utils/cn";

export function Avatar({ name = "", src, size = "md", className }) {
  const sizes = { sm: "size-9 text-xs", md: "size-12 text-sm", lg: "size-20 text-xl" };
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover", sizes[size], className)} />;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700",
        sizes[size],
        className
      )}
    >
      {initials || "?"}
    </div>
  );
}