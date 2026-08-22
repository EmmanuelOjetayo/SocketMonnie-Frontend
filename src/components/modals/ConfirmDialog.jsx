import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[380px] rounded-card bg-card p-5 shadow-card-lift">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant} fullWidth onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
