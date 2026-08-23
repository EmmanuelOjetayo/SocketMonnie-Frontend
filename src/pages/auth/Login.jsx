import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { loginSchema } from "@/utils/validators";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";

// Pulls the most specific, human-readable message out of whatever shape
// the error comes back as (Axios response, API error payload, network
// failure, etc.), and always logs the raw error so the real cause is
// visible in devtools rather than only the generic toast text.
function resolveErrorMessage(error) {
  console.error("Login request failed:", error);

  if (!error?.response && error?.message === "Network Error") {
    return "Network error — please check your internet connection and try again.";
  }

  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "Invalid email or password. Please try again."
  );
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values) {
    try {
      const res = await login(values);
      if (res?.success) {
        toast.success(res.message || "Welcome back!");
        const userRole = res?.data?.user?.role;
        if (userRole === ROLES.SUPER_ADMIN) {
          navigate(ROUTES.ADMIN);
        } else if (userRole === ROLES.FINANCE_MANAGER) {
          navigate(ROUTES.FINANCE);
        } else if (userRole === ROLES.CUSTOMER_SUPPORT) {
          navigate(ROUTES.SUPPORT);
        } else {
          navigate(ROUTES.DASHBOARD);
        }
      } else {
        // Login resolved without throwing, but the backend reported
        // failure (e.g. wrong password) — log the payload so the
        // actual reason is inspectable, not just the toast text.
        console.warn("Login unsuccessful:", res);
        toast.error(res?.message || "Login failed. Please check your credentials and try again.");
      }
    } catch (error) {
      toast.error(error?.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-24 font-sans text-gray-900">
      {/* Header — same gradient/radius treatment used across Loans, Savings, Reports */}
      <header
        className="relative px-5 py-4 text-white shadow-lg"
        style={{
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <h1 className="text-lg font-bold tracking-tight">Welcome Back</h1>
          <div className="w-10" />
        </div>
        <p className="mt-1 text-center text-xs font-medium text-[#dee3f9]">
          Log in to continue to your account
        </p>
      </header>

      <div className="px-5 space-y-5 mt-6">
        <Card className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              register={register}
              errors={errors}
              label="Email Address"
              icon={Mail}
              placeholder="you@example.com"
            />
            <FormField
              name="password"
              register={register}
              errors={errors}
              label="Password"
              icon={Lock}
              type="password"
              placeholder="••••••••"
            />
            <div className="text-right">
              <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-semibold text-brand-600">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
              Log In
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-text-secondary">
          New to Socket Moni?{" "}
          <Link to={ROUTES.REGISTER} className="font-semibold text-brand-600">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}