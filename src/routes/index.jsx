import { createBrowserRouter } from "react-router-dom";
import { ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { PlainShellLayout } from "@/layouts/PlainShellLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { FinanceLayout } from "@/layouts/FinanceLayout";
import { SupportLayout } from "@/layouts/SupportLayout";
import { ProtectedRoute } from "@/layouts/ProtectedRoute";

// Auth pages
import { GetStarted } from "@/pages/onboarding/GetStarted";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { VerifyOtp } from "@/pages/auth/VerifyOtp";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";

// Onboarding
import { PersonalInfo } from "@/pages/onboarding/PersonalInfo";
import { KycUpload } from "@/pages/onboarding/KycUpload";
import { CreatePin } from "@/pages/onboarding/CreatePin";
import { Biometrics } from "@/pages/onboarding/Biometrics";

// User pages
import { Dashboard } from "@/pages/user/Dashboard";
import { Savings } from "@/pages/user/Savings";
import { SavingsDeposit } from "@/pages/user/SavingsDeposit";
// import { SavingsDepositSuccess } from "@/pages/user/SavingsDepositSuccess";
import { Withdraw } from "@/pages/user/Withdraw";
import { ConfirmWithdrawal } from "@/pages/user/ConfirmWithdrawal";
import { WithdrawalSuccess } from "@/pages/user/WithdrawalSuccess";
import { Loans } from "@/pages/user/Loans";
import { LoanApply } from "@/pages/user/LoanApply";
import { LoanDetails } from "@/pages/user/LoanDetails";
import { LoanHistory } from "@/pages/user/LoanHistory";
import { LoansTracker } from "@/pages/user/LoansTracker";
import { LoanRepaySuccess } from "@/pages/user/LoanRepaySuccess";
import { Reports } from "@/pages/user/Reports";
import { Notifications } from "@/pages/user/Notifications";
import { Profile } from "@/pages/user/Profile";
import { Complaints } from "@/pages/user/Complaints";
import { SocketScore } from "@/pages/user/SocketScore";
import { Referrals } from "@/pages/user/Referrals";
import { LoanRepay } from "@/pages/user/LoanRepay";
import { MembershipFee } from "@/pages/user/MembershipFee";
import { GuarantorVerify } from "@/pages/user/GuarantorVerify";
// Admin
import { AdminDashboard } from "@/pages/admin/Dashboard";
import { AdminMembers } from "@/pages/admin/Members";
import { AdminLoans } from "@/pages/admin/LoansAdmin";
import { AdminReports } from "@/pages/admin/AdminReports";
import { WithdrawalApprovals } from "@/pages/admin/WithdrawalApprovals";
// Finance & Support
import { FinanceDashboard } from "@/pages/finance/FinanceDashboard";
import { SupportDashboard } from "@/pages/support/SupportDashboard";


import { AdminSettings } from "@/pages/admin/Settings";
import { DepositSuccess } from "@/pages/user/DepositSuccess";
import { DepositFailed } from "@/pages/user/DepositFailed";


import { NotFound } from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: ROUTES.GET_STARTED, element: <GetStarted /> }],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <Login /> },
      { path: ROUTES.REGISTER, element: <Register /> },
      { path: ROUTES.VERIFY_OTP, element: <VerifyOtp /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
    ],
  },
  {
    element: <OnboardingLayout />,
    children: [
      { path: ROUTES.ONBOARDING_PERSONAL_INFO, element: <PersonalInfo /> },
      { path: ROUTES.ONBOARDING_KYC, element: <KycUpload /> },
      { path: ROUTES.ONBOARDING_CREATE_PIN, element: <CreatePin /> },
      { path: ROUTES.ONBOARDING_BIOMETRICS, element: <Biometrics /> },
    ],
  },
  {
    element: <ProtectedRoute roles={[ROLES.MEMBER]} />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <Dashboard /> },
          { path: ROUTES.SAVINGS, element: <Savings /> },
          { path: ROUTES.LOANS, element: <Loans /> },
          { path: ROUTES.LOAN_TRACKER, element: <LoansTracker /> },
          { path: ROUTES.REPORTS, element: <Reports /> },
          { path: ROUTES.PROFILE, element: <Profile /> },
        ],
      },
      {
        element: <PlainShellLayout />,
        children: [
          { path: ROUTES.SAVINGS_DEPOSIT, element: <SavingsDeposit /> },
          { path: ROUTES.SAVINGS_DEPOSIT_SUCCESS, element: <DepositSuccess /> },
          { path: ROUTES.PAYMENTS_SAVINGS_SUCCESS, element: <DepositSuccess /> },
          { path: ROUTES.PAYMENTS_SAVINGS_FAILED, element: <DepositFailed /> },
          { path: ROUTES.MEMBERSHIP_FEE, element: <MembershipFee /> },
          { path: ROUTES.SAVINGS_WITHDRAW, element: <Withdraw /> },
          { path: ROUTES.SAVINGS_WITHDRAW_CONFIRM, element: <ConfirmWithdrawal /> },
          { path: ROUTES.SAVINGS_WITHDRAW_SUCCESS, element: <WithdrawalSuccess /> },
          { path: ROUTES.LOAN_REPAY, element: <LoanRepay /> },
          { path: ROUTES.LOAN_APPLY, element: <LoanApply /> },
          {path: ROUTES.GUARANTOR_VERIFY, element: <GuarantorVerify />},
          { path: ROUTES.LOAN_DETAILS, element: <LoanDetails /> },
          { path: ROUTES.LOAN_HISTORY, element: <LoanHistory /> },
          { path: ROUTES.LOAN_REPAY_SUCCESS, element: <LoanRepaySuccess /> },
          { path: ROUTES.NOTIFICATIONS, element: <Notifications /> },
          { path: ROUTES.COMPLAINTS, element: <Complaints /> },
          { path: ROUTES.SOCKET_SCORE, element: <SocketScore /> },
          { path: ROUTES.REFERRALS, element: <Referrals /> },
          { path: ROUTES.DEPOSIT_SUCCESS, element: <DepositSuccess /> },
{ path: ROUTES.DEPOSIT_FAILED, element: <DepositFailed /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={[ROLES.SUPER_ADMIN]} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: ROUTES.ADMIN, element: <AdminDashboard /> },
          { path: ROUTES.ADMIN_MEMBERS, element: <AdminMembers /> },
          { path: ROUTES.ADMIN_LOANS, element: <AdminLoans /> },
          { path: ROUTES.ADMIN_REPORTS, element: <AdminReports /> },
          { path: ROUTES.ADMIN_SETTINGS, element: <AdminSettings /> },
          {path: ROUTES.WITHDRAWS, element: <WithdrawalApprovals /> }
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={[ROLES.FINANCE_MANAGER]} />,
    children: [
      {
        element: <FinanceLayout />,
        children: [{ path: ROUTES.FINANCE, element: <FinanceDashboard /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={[ROLES.CUSTOMER_SUPPORT]} />,
    children: [
      {
        element: <SupportLayout />,
        children: [{ path: ROUTES.SUPPORT, element: <SupportDashboard /> }],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);