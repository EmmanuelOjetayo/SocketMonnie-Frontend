import { receiptShareText } from "@/utils/receiptData";
import { receiptPdfBlob } from "@/utils/receiptPdf";

/**
 * Share a receipt using the native share sheet where the platform provides
 * one, falling back to copying a text summary to the clipboard.
 *
 * On mobile the PDF file itself is shared (so the recipient gets the actual
 * document); elsewhere the receipt summary is shared as text.
 *
 * @param {object} data canonical receipt model
 * @returns {Promise<{shared: boolean, method: "native"|"clipboard"|"none", cancelled?: boolean, error?: string}>}
 */
export async function shareReceipt(data) {
  const text = receiptShareText(data);
  const title = "SocketMonnie Payment Receipt";

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (hasNativeShare) {
    try {
      // Prefer sharing the real PDF document when the platform supports files.
      const blob = await receiptPdfBlob(data);
      const file = new File([blob], `SocketMonnie-Receipt-${data.reference || "transaction"}.pdf`, {
        type: "application/pdf",
      });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return { shared: true, method: "native" };
      }

      await navigator.share({ title, text });
      return { shared: true, method: "native" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { shared: false, cancelled: true, method: "none" };
      }
      // Any other share failure falls through to the clipboard fallback.
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { shared: false, method: "clipboard" };
    }
  } catch {
    /* clipboard unavailable */
  }

  return { shared: false, method: "none" };
}
