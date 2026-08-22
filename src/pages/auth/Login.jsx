import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { loginSchema } from "@/utils/validators";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import { ROLES } from "@/constants/roles";

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
        toast.error(res?.message || "Login failed");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid email or password");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-text-primary">Welcome back</h1>
      <p className="mt-1 text-sm text-text-secondary">Log in to continue to your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
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

      <p className="mt-6 text-center text-sm text-text-secondary">
        New to Socket Moni?{" "}
        <Link to={ROUTES.REGISTER} className="font-semibold text-brand-600">
          Create an account
        </Link>
      </p>
    </div>
  );
}