import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockMember } from "@/mock/member";

/**
 * ## Login
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { success, token, user }
 */
export async function login({ email, password }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, token: "mock_jwt_token", user: mockMember });
  }
  return apiClient.post("/auth/login", { email, password }, { auth: false });
}

/**
 * ## Register
 * POST /api/auth/register
 * Body: { fullName, email, phone, referralCode, password }
 * Response: { success, userId, ... }
 */
export async function register(payload) {
  if (USE_MOCK) {
    return mockDelay({ success: true, memberId: "mem_new", status: "pending_kyc" });
  }
  return apiClient.post("/auth/register", payload, { auth: false });
}

/**
 * ## Verify OTP
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Response: { success, token, user }
 */
export async function verifyOtp({ email, otp }) {
  if (USE_MOCK) {
    return mockDelay({ success: true, verified: true });
  }
  return apiClient.post("/auth/verify-otp", { email, otp }, { auth: false });
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
  return apiClient.post("/auth/forgot-password", { email }, { auth: false });
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
  return apiClient.post("/auth/reset-password", { email, otp, newPassword }, { auth: false });
}

/**
 * ## Logout
 * POST /api/auth/logout
 */
export async function logout() {
  localStorage.removeItem("socketmoni_token");
  if (USE_MOCK) return mockDelay({ success: true });
  return apiClient.post("/auth/logout", {});
}