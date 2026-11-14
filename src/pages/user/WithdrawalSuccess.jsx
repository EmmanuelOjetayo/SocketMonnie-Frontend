import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import TransactionSuccessLayout from "@/components/success/TransactionSuccessLayout";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { buildReceiptData } from "@/utils/receiptData";
import { formatNaira } from "@/utils/format";
import { downloadReceiptPdf } from "@/utils/receiptPdf";
import { shareReceipt } from "@/utils/receiptShare";

/**
 * Withdrawal request confirmation.
 *
 * A withdrawal is not a payment: the request is created server-side and
 * waits for administrative approval, so there is no provider webhook to
 * wait for. The backend record is still consulted (GET
 * /api/payments/status/:reference) so the amount, fee and status shown
 * here come from the database rather than from the browser.
 *
 * The receipt is deliberately marked PENDING — a withdrawal request is
 * never presented as a completed payout.
 */
export function WithdrawalSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    amount: expectedAmount = 0,
    fee: expectedFee = 0,
    totalDeducted = Number(expectedAmount || 0) + Number(expectedFee || 0),
    status: expectedStatus = "pending_approval",
    destinationBank = {},
    reference = null,
    date = null,
  } = state || {};

  const { transaction, status } = usePaymentConfirmation(reference);

  const isConfirmed = Boolean(transaction);
  const confirmedStatus = transaction?.status || "pending";
  const isPending = confirmedStatus === "pending" || expectedStatus === "pending_approval";

  const amount = isConfirmed ? Number(transaction.amount || 0) : Number(expectedAmount || 0);
  const fee = isConfirmed ? Number(transaction.fee || 0) : Number(expectedFee || 0);
  const total = isConfirmed ? amount + fee : Number(totalDeducted || 0);

  const destination = useMemo(
    () => transaction?.destinationBank || destinationBank || {},
    [transaction, destinationBank]
  );

  // Canonical receipt — built from the backend record whenever one exists.
  const receipt = useMemo(
    () =>
      isConfirmed
        ? buildReceiptData(transaction, {
            metadata: {
              fee,
              destinationBank: {
                bankName: destination.bankName,
                accountName: destination.accountName,
                accountNumber: destination.accountNumber,
              },
            },
          })
        : null,
    [isConfirmed, transaction, fee, destination]
  );

  const details = useMemo(() => {
    const rows = [
      {
        label: "Amount",
        value: formatNaira(amount, { decimals: 2 }),
      },
      {
        label: "Status",
        value: isPending ? "Pending Approval" : "Processing",
        tone: isPending ? undefined : "success",
      },
      {
        label: "Withdrawal fee",
        value: formatNaira(fee, { decimals: 2 }),
      },
      {
        label: "Total deduction",
        value: formatNaira(total, { decimals: 2 }),
      },
    ];

    if (destination.bankName) {
      rows.push({ label: "Destination Bank", value: destination.bankName });
    }
    if (destination.accountName) {
      rows.push({ label: "Account Name", value: destination.accountName });
    }
    if (destination.accountNumber) {
      rows.push({ label: "Account Number", value: destination.accountNumber });
    }

    rows.push({
      label: "Date & Time",
      value: date ? new Date(date).toLocaleString() : "—",
    });
    rows.push({ label: "Reference ID", value: reference || "N/A" });

    return rows;
  }, [amount, fee, total, isPending, destination, date, reference]);

  const actions = useMemo(
    () => [
      {
        label: "Back to Savings",
        variant: "primary",
        onClick: () => navigate(ROUTES.SAVINGS),
      },
    ],
    [navigate]
  );

  const handleDownload = async () => {
    if (!receipt) return;
    const toastId = toast.loading("Preparing your receipt...");
    try {
      await downloadReceiptPdf(receipt);
      toast.success("Receipt downloaded", { id: toastId });
    } catch (error) {
      toast.error(error?.message || "Could not generate the PDF receipt", { id: toastId });
    }
  };

  const handleShare = async () => {
    if (!receipt) return;
    const toastId = toast.loading("Preparing receipt to share...");
    try {
      const result = await shareReceipt(receipt);
      if (result?.cancelled) {
        toast.dismiss(toastId);
      } else if (result?.method === "clipboard") {
        toast.success("Receipt summary copied to clipboard", { id: toastId });
      } else if (result?.method === "native") {
        toast.success("Receipt shared", { id: toastId });
      } else {
        toast.error("Sharing is not supported on this device", { id: toastId });
      }
    } catch (error) {
      toast.error(error?.message || "Could not share the receipt", { id: toastId });
    }
  };

  const tone = isPending ? "pending" : "success";

  const title = "Withdrawal Request Submitted";
  const subtitle =
    "Your savings have been submitted for withdrawal. The payout will be processed after the request is reviewed and approved.";

  return (
    <div className="min-h-screen bg-[#F7F8FB] pb-8">
      <TransactionSuccessLayout
        title={title}
        amount={formatNaira(amount, { decimals: 2 })}
        subtitle={subtitle}
        rows={details}
        primaryActions={actions}
        tone={tone}
        showReceiptActions={Boolean(receipt)}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {receipt && (
        <div className="px-4">
          <p className="mb-2 text-center text-[10px] font-medium leading-relaxed text-gray-400">
            This receipt records a withdrawal request awaiting approval — it is not a completed payout.
          </p>
        </div>
      )}

      {status === "not_found" && (
        <p className="px-5 text-center text-[10px] font-medium text-gray-400">
          We could not find this withdrawal in your records. If you were charged, contact support.
        </p>
      )}
    </div>
  );
}
