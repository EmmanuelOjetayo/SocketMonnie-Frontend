import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/cn";

/** Mobile-style bottom sheet used for filters, actions, and forms. */
export function BottomSheet({ isOpen, onClose, title, children, className }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-card p-5 pb-8 shadow-card-lift",
          "animate-[slideUp_0.25s_ease-out]",
          className
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-pill bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <IconButton icon={X} label="Close" onClick={onClose} variant="filled" size="sm" />
        </div>
        {children}
      </div>
    </div>
  );
}