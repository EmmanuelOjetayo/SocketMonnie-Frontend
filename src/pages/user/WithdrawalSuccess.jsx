import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { SuccessReceipt } from "@/components/success/SuccessReceipt";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { ROUTES } from "@/constants/routes";
import { usePaymentConfirmation } from "@/hooks/usePaymentConfirmation";
import { buildReceiptData } from "@/utils/receiptData";
import { formatNaira } from "@/utils/format";

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

  const destination = transaction?.destinationBank || destinationBank || {};

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

  const title = "Withdrawal Request Submitted";
  const subtitle =
    "Your savings have been submitted for withdrawal. The payout will be processed after the request is reviewed and approved.";

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SuccessReceipt
        title={title}
        amount={amount}
        subtitle={subtitle}
        details={details}
        actions={actions}
        status={isPending ? "pending" : "successful"}
        receipt={receipt}
      />

      {receipt && (
        <div className="px-5">
          <p className="mb-2 text-center text-[10px] font-medium leading-relaxed text-gray-400">
            This receipt records a withdrawal request awaiting approval — it is
            not a completed payout.
          </p>
          <ReceiptActions data={receipt} showView={false} layout="row" />
        </div>
      )}

      {status === "not_found" && (
        <p className="px-5 text-center text-[10px] font-medium text-gray-400">
          We could not find this withdrawal in your records. If you were
          charged, contact support.
        </p>
      )}
    </div>
  );
}
