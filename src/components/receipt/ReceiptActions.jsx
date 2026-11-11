import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Eye, Share2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { downloadReceiptPdf } from "@/utils/receiptPdf";
import { shareReceipt } from "@/utils/receiptShare";
import { cn } from "@/utils/cn";

/**
 * The receipt action row — identical on every surface.
 *
 * "View receipt" opens the receipt viewer, "Download PDF" writes a real
 * vector PDF, "Share" uses the native share sheet (or copies the receipt
 * summary). Every surface that shows a receipt shows these same actions,
 * so the experience never diverges.
 */
export function ReceiptActions({
  data,
  onViewReceipt,
  className,
  showView = true,
  size = "md",
  layout = "stack",
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!data) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading("Preparing your receipt…");
    try {
      const filename = await downloadReceiptPdf(data);
      toast.success("Receipt downloaded", { id: toastId });
      return filename;
    } catch (error) {
      toast.error(error?.message || "Could not generate the PDF receipt", {
        id: toastId,
      });
      return null;
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const toastId = toast.loading("Preparing receipt to share…");
    try {
      const result = await shareReceipt(data);
      if (result.cancelled) {
        toast.dismiss(toastId);
      } else if (result.method === "clipboard") {
        toast.success("Receipt summary copied to clipboard", { id: toastId });
      } else if (result.method === "native") {
        toast.success("Receipt shared", { id: toastId });
      } else {
        toast.error("Sharing is not supported on this device", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.message || "Could not share the receipt", { id: toastId });
    } finally {
      setIsSharing(false);
    }
  };

  const downloadButton = (
    <Button
      fullWidth
      size={size}
      icon={Download}
      isLoading={isDownloading}
      onClick={handleDownload}
      className="rounded-xl bg-[#3557d4] text-[11px] font-bold text-white shadow-sm hover:bg-[#2845b5]"
    >
      Download PDF
    </Button>
  );

  const shareButton = (
    <Button
      fullWidth
      size={size}
      variant="outline"
      icon={Share2}
      isLoading={isSharing}
      onClick={handleShare}
      className="rounded-xl border-[#dee3f9] bg-white text-[11px] font-bold text-[#090f24]"
    >
      Share receipt
    </Button>
  );

  const viewButton = showView && onViewReceipt ? (
    <Button
      fullWidth
      size={size}
      variant="outline"
      icon={Eye}
      onClick={onViewReceipt}
      className="rounded-xl border-[#dee3f9] bg-white text-[11px] font-bold text-[#090f24]"
    >
      View receipt
    </Button>
  ) : null;

  if (layout === "row") {
    return (
      <div className={cn("grid grid-cols-2 gap-2.5", className)}>
        {downloadButton}
        {shareButton}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {viewButton}
      {downloadButton}
      {shareButton}
    </div>
  );
}
