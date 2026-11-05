import { X, FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

/**
 * Full-screen preview of a member's KYC document.
 * `doc` may be a plain URL string, or an object with a `documentUrl`
 * (falls back to `url`), plus optional `type` label.
 */
export function KycDocumentPreview({ doc, onClose }) {
  if (!doc) return null;

  const url = typeof doc === "string" ? doc : doc?.documentUrl || doc?.url || doc?.kycDocument || "";
  const label = typeof doc === "object" ? doc?.type || "KYC Document" : "KYC Document";
  const isImage = /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(url);
  const isPdf = /\.(pdf)(\?.*)?$/i.test(url);

  if (!url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative z-10 w-full max-w-[420px] rounded-card bg-card p-5 shadow-card-lift">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-text-primary">{label}</h3>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary" aria-label="Close preview">
              <X className="size-5" />
            </button>
          </div>
          <p className="text-sm text-text-secondary">This document file is unavailable. Please ask the member to re-upload.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cn("relative z-10 w-full rounded-card bg-card shadow-card-lift flex flex-col overflow-hidden", "max-w-[560px] max-h-[85vh]")}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-4 text-emerald-600 shrink-0" />
            <h3 className="text-sm font-bold text-text-primary truncate">{label}</h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary" aria-label="Close preview">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-surface-alt/50">
          {isImage ? (
            <img src={url} alt={label} className="w-full h-auto object-contain" />
          ) : isPdf ? (
            <object data={url} type="application/pdf" className="w-full h-[60vh]">
              <p className="p-5 text-sm text-text-secondary">
                Inline PDF preview is not supported on this device. Use the button below to open it.
              </p>
            </object>
          ) : (
            <div className="p-5 text-center">
              <FileText className="size-8 mx-auto text-text-muted mb-3" />
              <p className="text-sm text-text-secondary mb-4">
                This file type cannot be previewed inline. Open or download it below.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-3.5 border-t border-border-subtle">
          <Button variant="outline" fullWidth onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
            <ExternalLink className="size-4 mr-1.5" /> Open
          </Button>
          <Button variant="primary" fullWidth onClick={onClose}>
            <Download className="size-4 mr-1.5" /> Done
          </Button>
        </div>
      </div>
    </div>
  );
}
