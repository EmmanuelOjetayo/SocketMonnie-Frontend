import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ROUTES } from "@/constants/routes";

export function ProtectedRoute({ roles }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // 1. While AuthContext is checking localStorage/token on refresh, show a loader
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingState rows={1} />
      </div>
    );
  }

  // 2. If finished loading and still not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // 3. Optional: Role check
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // 4. Authenticated & authorized -> render the page outlet
  return <Outlet />;
}