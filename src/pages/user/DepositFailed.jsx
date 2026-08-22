import { useLocation, useNavigate } from "react-router-dom";
import { TopHeader } from "@/components/navigation/TopHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AlertTriangle } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export function DepositFailed() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const queryTxRef = params.get("tx_ref") || params.get("reference") || null;
  const queryReason = params.get("reason") || location.state?.reason || "payment_failed";

  return (
    <div>
      <TopHeader title="Deposit Failed" showBack={false} />
      <div className="px-5 pb-8 flex flex-col items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-danger-50 text-danger-500">
          <AlertTriangle className="size-10" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-text-primary">Payment Failed</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Your deposit could not be completed. Please try again or contact support.
        </p>
        <Card className="mt-6 w-full p-4">
          <p className="text-xs text-text-muted">Possible reasons: insufficient funds, network error, or cancelled payment.</p>
          {queryTxRef ? (
            <p className="mt-2 text-xs text-text-secondary">Reference: {queryTxRef}</p>
          ) : null}
          {queryReason ? (
            <p className="mt-2 text-xs text-text-secondary">Reason: {queryReason}</p>
          ) : null}
        </Card>
        <Button fullWidth className="mt-6" onClick={() => navigate(ROUTES.SAVINGS_DEPOSIT)}>
          Try Again
        </Button>
        <Button variant="outline" fullWidth className="mt-3" onClick={() => navigate(ROUTES.SAVINGS)}>
          Back to Savings
        </Button>
      </div>
    </div>
  );
}