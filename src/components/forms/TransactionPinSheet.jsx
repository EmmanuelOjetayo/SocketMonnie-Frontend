import { useEffect, useRef, useState } from "react";
import { Delete, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/utils/cn";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * TransactionPinSheet — reusable OPay-style bottom-sheet PIN authorization.
 *
 * One component serves every SocketMonnie action that requires a transaction
 * PIN (withdrawal today, and any future protected action). The sheet owns only
 * the collection UI: it never validates the PIN itself and never persists it.
 * `onComplete(pin)` must perform the real, authenticated backend verification;
 * the sheet shows a loading state while that promise is in flight, clears the
 * PIN on failure, and lets the caller close it on success.
 *
 * Security:
 *  - The PIN lives only in component state and is cleared on close/error.
 *  - It is never written to storage, never logged, never rendered as text.
 *  - Submissions are guarded so a double-tap cannot authorize twice.
 */
export function TransactionPinSheet({
  isOpen,
  onClose,
  onComplete,
  length = 4,
  title = "Enter Transaction PIN",
  subtitle = `Enter your ${length}-digit PIN to authorize this transaction.`,
  context,
}) {
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);

  // Reset every trace of the PIN whenever the sheet is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(null);
      setVerifying(false);
      busyRef.current = false;
    }
  }, [isOpen]);

  async function submit(value) {
    if (busyRef.current) return;
    busyRef.current = true;
    setVerifying(true);
    setError(null);
    try {
      await onComplete?.(value);
      setPin("");
    } catch (err) {
      const message =
        err?.data?.message || err?.message || "Incorrect PIN. Please try again.";
      setError(message);
      setPin("");
    } finally {
      setVerifying(false);
      busyRef.current = false;
    }
  }

  // Auto-authorize as soon as the configured length is reached.
  useEffect(() => {
    if (isOpen && pin.length === length && !busyRef.current) {
      submit(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, length, isOpen]);

  function handleKey(key) {
    if (verifying || pin.length >= length) return;
    setPin((prev) => prev + key);
  }

  function handleDelete() {
    if (verifying || pin.length === 0) return;
    setPin((prev) => prev.slice(0, -1));
  }

  function handleClose() {
    if (verifying) return;
    onClose?.();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Cancel transaction"
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]"
      />

      <div className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-card px-5 pt-3 shadow-card-lift animate-[slideUp_0.28s_cubic-bezier(0.32,0.72,0,1)] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {/* drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-pill bg-border" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <ShieldCheck className="size-4.5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-text-primary">{title}</h3>
              <p className="text-[11px] leading-snug text-text-secondary">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={verifying}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary transition hover:bg-border disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        {context && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-surface-alt px-3 py-2 text-center text-[11px] font-semibold text-text-secondary">
            {context}
          </div>
        )}

        {/* PIN indicators — never render the actual digits */}
        <div className="mb-2 flex items-center justify-center gap-3" aria-hidden="true">
          {Array.from({ length }).map((_, i) => {
            const filled = i < pin.length;
            const isLast = i === pin.length - 1;
            return (
              <span
                key={i}
                className={cn(
                  "size-3.5 rounded-full border-2 transition-all duration-150",
                  filled ? "border-brand-600 bg-brand-600" : "border-border bg-transparent",
                  isLast && filled && "scale-110"
                )}
              />
            );
          })}
        </div>

        {/* status line */}
        <div className="mb-4 mt-3 min-h-5 text-center">
          {verifying ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600">
              <Loader2 className="size-3.5 animate-spin" />
              Verifying PIN…
            </span>
          ) : error ? (
            <span className="text-[11px] font-semibold text-danger-600">{error}</span>
          ) : (
            <span className="text-[10px] text-text-muted">
              {pin.length} of {length} digits entered
            </span>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {DIGITS.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKey(digit)}
              disabled={verifying}
              aria-label={`Digit ${digit}`}
              className="h-14 rounded-2xl bg-surface-alt/70 text-lg font-bold text-text-primary transition-all duration-100 active:scale-[0.96] active:bg-brand-100 disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <span />
          <button
            type="button"
            onClick={() => handleKey("0")}
            disabled={verifying}
            aria-label="Digit 0"
            className="h-14 rounded-2xl bg-surface-alt/70 text-lg font-bold text-text-primary transition-all duration-100 active:scale-[0.96] active:bg-brand-100 disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={verifying || pin.length === 0}
            aria-label="Delete last digit"
            className="flex h-14 items-center justify-center rounded-2xl bg-surface-alt/70 text-text-secondary transition-all duration-100 active:scale-[0.96] active:bg-brand-100 disabled:opacity-40"
          >
            <Delete className="size-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={verifying}
          className="mt-4 w-full text-center text-xs font-bold text-text-secondary transition hover:text-text-primary disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
