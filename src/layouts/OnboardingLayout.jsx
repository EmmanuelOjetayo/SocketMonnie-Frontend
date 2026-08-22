import { Outlet } from "react-router-dom";

/** Wraps post-signup onboarding: personal info, KYC, PIN, biometrics. */
export function OnboardingLayout() {
  return (
    <div id="app-shell">
      <div className="px-6 pb-10 pt-8">
        <Outlet />
      </div>
    </div>
  );
}