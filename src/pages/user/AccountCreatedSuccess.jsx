import { useNavigate } from "react-router-dom";
import SuccessBadge from "@/components/success/SuccessBadge";
import { ROUTES } from "@/constants/routes";

/**
 * Account-created success screen (end of onboarding).
 *
 * Visually consistent with the receipt success screens, minus the receipt.
 */
export function AccountCreatedSuccess({ nextPath = ROUTES.DASHBOARD || "/dashboard" }) {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center bg-[#F7F8FB] px-4 pb-8 pt-28 font-sans">
      <SuccessBadge />
      <h1 className="mt-7 text-[15px] font-bold text-gray-900">Account Created</h1>
      <p className="mt-2 max-w-[240px] text-center text-[11px] leading-relaxed text-gray-600">
        Your account is ready. You can start saving right away.
      </p>
      <button
        type="button"
        onClick={() => navigate(nextPath, { replace: true })}
        className="mt-auto rounded-lg bg-[#3B5BDB] px-7 py-3 text-[13px] font-semibold text-white transition hover:bg-[#364fc7] active:scale-[0.98]"
      >
        Go to Dashboard
      </button>
    </main>
  );
}
