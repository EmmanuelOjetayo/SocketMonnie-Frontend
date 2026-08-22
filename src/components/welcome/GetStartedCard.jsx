import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export function GetStartedCard({ logo, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-brand-950 px-6 py-12 text-white">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-brand-600">
          {logo ? (
            <img src={logo} alt="Logo" className="size-12" />
          ) : (
            <ShieldCheck className="size-12" />
          )}
        </div>
        <h1 className="text-2xl font-extrabold">{title || "Socket Moni"}</h1>
        <p className="mt-3 max-w-xs text-sm text-brand-100">
          {subtitle || "Save, borrow, and grow with Nigeria's most trusted digital cooperative platform."}
        </p>
      </div>
      <div className="space-y-3">
        <Link to={ROUTES.REGISTER}>
          <Button fullWidth size="lg" variant="primary">
            Create Account
          </Button>
        </Link>
        <Link to={ROUTES.LOGIN}>
          <Button fullWidth size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            I already have an account
          </Button>
        </Link>
      </div>
    </div>
  );
}