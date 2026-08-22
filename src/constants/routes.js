// src/constants/routes.js
// Central route map. Import these instead of hardcoding path strings.

export const ROUTES = {
  // Public
  GET_STARTED: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_OTP: "/verify-otp",

  // Onboarding (post-signup, pre-dashboard)
  ONBOARDING_PERSONAL_INFO: "/onboarding/personal-info",
  ONBOARDING_KYC: "/onboarding/kyc",
  ONBOARDING_CREATE_PIN: "/onboarding/create-pin",
  ONBOARDING_BIOMETRICS: "/onboarding/biometrics", // optional
  ONBOARDING_SUCCESS: "/onboarding/success",

  // Member (user) app
  DASHBOARD: "/dashboard",
  SAVINGS: "/dashboard/savings",
  SAVINGS_DEPOSIT: "/dashboard/savings/deposit",
  SAVINGS_WITHDRAW: "/dashboard/savings/withdraw",
  SAVINGS_WITHDRAW_CONFIRM: "/dashboard/savings/withdraw/confirm",
  SAVINGS_WITHDRAW_SUCCESS: "/dashboard/savings/withdraw/success",
  SAVINGS_DEPOSIT_SUCCESS: "/dashboard/savings/deposit/success",
  LOANS: "/dashboard/loans",
  LOAN_TRACKER: "/dashboard/loans/tracker",
  LOAN_APPLY: "/dashboard/loans/apply",
  LOAN_REPAY: "/dashboard/loans/repay",
  LOAN_APPLY_SUCCESS: "/dashboard/loans/apply/success",
  LOAN_DETAILS: "/dashboard/loans/:loanId",
  LOAN_HISTORY: "/dashboard/loans/history",
  LOAN_REPAY_SUCCESS: "/dashboard/loans/repay/success",
  PAYMENTS_SAVINGS_SUCCESS: "/payments/savings/success",
  PAYMENTS_SAVINGS_FAILED: "/payments/savings/failed",
  MEMBERSHIP_FEE: "/membership-fee",
  REPORTS: "/dashboard/reports",
  NOTIFICATIONS: "/dashboard/notifications",
  PROFILE: "/dashboard/profile",
  GUARANTOR_VERIFY: "/guarantor/verify/:token",

  // Super Admin
  ADMIN: "/admin",
  ADMIN_SETTINGS: "/admin/settings",
  DEPOSIT_SUCCESS: "/deposit-success",
  DEPOSIT_FAILED: "/deposit-failed",
  ADMIN_MEMBERS: "/admin/members",
  ADMIN_LOANS: "/admin/loans",
  ADMIN_REPORTS: "/admin/reports",
  WITHDRAWS:"/admin/withdraws",

  // Finance Manager
  FINANCE: "/finance",

  // Customer Support
  SUPPORT: "/support",
};