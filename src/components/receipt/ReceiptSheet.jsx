import { BottomSheet } from "@/components/feedback/BottomSheet";
import { TransactionReceipt } from "@/components/receipt/TransactionReceipt";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";

/**
 * The receipt viewer.
 *
 * Opens the SAME receipt the member sees on the success page and in the
 * PDF export, with the same download/share actions — one receipt design
 * across the whole product.
 */
export function ReceiptSheet({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Payment receipt"
      className="max-h-[88vh] overflow-y-auto"
    >
      <TransactionReceipt data={data} />

      <ReceiptActions data={data} showView={false} className="mt-4" />
    </BottomSheet>
  );
}
