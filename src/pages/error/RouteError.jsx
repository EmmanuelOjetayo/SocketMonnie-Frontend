import { Link, useNavigate, useRouteError } from "react-router-dom";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

/**
 * Route-level error boundary (React Router errorElement).
 * Catches render/data errors on any route and shows a user-friendly
 * screen instead of the raw development error overlay.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  // 404 bubbles here from *"splat" matches when no explicit page matches.
  if (error?.status === 404) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl font-extrabold text-text-primary">404</h1>
        <p className="text-sm text-text-secondary">This page doesn't exist.</p>
        <Link to={ROUTES.DASHBOARD}>
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const message =
    error?.data?.message ||
    error?.message ||
    "Something unexpected went wrong while loading this page.";

  console.error("[RouteError]", error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-warning-50">
        <AlertTriangle className="size-7 text-warning-600" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h1 className="text-xl font-extrabold text-text-primary">Something went wrong</h1>
        <p className="text-sm text-text-secondary break-words">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> Go Back
        </Button>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" /> Try Again
        </Button>
      </div>
    </div>
  );
}
