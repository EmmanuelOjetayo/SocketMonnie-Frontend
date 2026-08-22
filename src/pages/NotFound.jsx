import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export function NotFound() {
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
