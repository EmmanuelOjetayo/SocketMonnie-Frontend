import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockMember } from "@/mock/member";

/**
 * ## Login
 * POST /api/auth/login
 * Body: { email, password, termsAccepted, privacyAccepted }
 * Response: { success, user }
 * Backend sets an httpOnly cookie — no token returned.
 */
export async function login({ email, password, termsAccepted, privacyAccepted }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, user: mockMember });
  }
  return apiClient.post("/auth/login", { email, password, termsAccepted, privacyAccepted });
}

/**
 * ## Register
 * POST /api/auth/register
 * Body: { fullName, email, phone, referralCode, password, termsAccepted, privacyAccepted }
 *   — both consent flags are required by the backend signUpSchema (Batch F).
 * Response: { success, userId, ... }
 */
export async function register(payload) {
  if (USE_MOCK) {
    return mockDelay({ success: true, memberId: "mem_new", status: "pending_kyc" });
  }
  return apiClient.post("/auth/register", payload);
}

/**
 * ## Verify OTP
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Response: { success, verified, user }
 * Backend sets an httpOnly cookie — no token returned.
 */
export async function verifyOtp({ email, otp }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, verified: true });
  }
  return apiClient.post("/auth/verify-otp", { email, otp });
}

/**
 * ## Forgot Password
 * POST /api/auth/forgot-password
 * Body: { email }
 * Response: { success, message }
 */
export async function forgotPassword({ email }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, message: "Reset link sent" });
  }
  return apiClient.post("/auth/forgot-password", { email });
}

/**
 * ## Reset Password
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 * Response: { success, message }
 */
export async function resetPassword({ email, otp, newPassword }) {
  if (USE_MOCK) {
    return mockDelay({ success: true });
  }
  return apiClient.post("/auth/reset-password", { email, otp, newPassword });
}

/**
 * ## Logout
 * POST /api/auth/logout
 * Backend clears the httpOnly cookie.
 */
export async function logout() {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiClient.post("/auth/logout", {});
}
