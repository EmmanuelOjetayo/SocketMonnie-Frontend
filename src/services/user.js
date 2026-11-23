import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";
import { mockMember } from "@/mock/member";

/**
 * ## Get Current Member Profile
 * GET /api/user/me
 * Response: { success, user }
 */
export async function getCurrentUser() {
  if (USE_MOCK) return mockDelay({ success: true, user: mockMember });
  return apiClient.get("/user/me");
}

/**
 * ## Update Personal Info
 * PATCH /api/user/personal-info
 * Body: { dateOfBirth, gender, address, stateOfOrigin, occupation }
 * Response: { success, user }
 */
export async function updatePersonalInfo(payload) {
  if (USE_MOCK) return mockDelay({ success: true, user: { ...mockMember, ...payload } });
  return apiClient.patch("/user/personal-info", payload);
}

/**
 * ## Upload KYC Document
 * POST /api/user/kyc
 * Body: FormData { documentType, file, nin }
 * Response: { success, data: { kycStatus, kycSubmitted } }
 */
export async function uploadKycDocument(formData) {
  if (USE_MOCK) return mockDelay({ success: true, status: "pending_review" });
  return apiClient.post("/user/kyc", formData);
}

/**
 * ## View submitted KYC details (PIN protected)
 * POST /api/user/kyc/view
 * Body: { pin } — the backend verifies the bcrypt-hashed transaction PIN
 * before returning NIN/document data. No user id is accepted from the client.
 * Response: { success, data: { kyc } }
 */
export async function viewKycDetails({ pin }) {
  if (USE_MOCK) return mockDelay({ success: true, data: { kyc: null } });
  return apiClient.post("/user/kyc/view", { pin });
}

/**
 * ## Upload / Replace Profile Picture
 * POST /api/user/profile-picture
 * Body: FormData { file }
 * Response: { success, data: { avatarUrl, selfieUrl } }
 */
export async function uploadProfilePicture(formData) {
  if (USE_MOCK) return mockDelay({ success: true, data: { avatarUrl: null } });
  return apiClient.post("/user/profile-picture", formData);
}

/**
 * ## Delete Profile Picture (CRUD "D")
 * DELETE /api/user/profile-picture
 * Response: { success, data: { avatarUrl: null, selfieUrl: null, alreadyDeleted } }
 * Idempotent — deleting with no picture set returns alreadyDeleted: true.
 */
export async function deleteProfilePicture() {
  if (USE_MOCK) return mockDelay({ success: true, data: { avatarUrl: null, selfieUrl: null, alreadyDeleted: false } });
  return apiClient.delete("/user/profile-picture");
}

/**
 * ## Server-side draft sync (owner decision #4)
 * GET /api/user/draft?kind=loan_application
 * Response: { success, data: { draft | null } } — null when none/expired.
 */
export async function getUserDraft(kind = "loan_application") {
  const res = await apiClient.get(`/user/draft?kind=${encodeURIComponent(kind)}`);
  return res?.data?.draft || null;
}

/**
 * PUT /api/user/draft — Body: { kind, data } (backend sanitizes forbidden keys)
 */
export async function saveUserDraft(data, kind = "loan_application") {
  return apiClient.put("/user/draft", { kind, data });
}

/**
 * DELETE /api/user/draft — clear after successful submission.
 */
export async function deleteUserDraft() {
  return apiClient.delete("/user/draft");
}

/**
 * PATCH /api/user/terms/accept — record Terms & Conditions / Privacy Policy
 * acceptance for the authenticated user (owner-approved consent tracking).
 * Body: { termsAccepted: true, privacyAccepted: true }
 */
export async function acceptTerms(termsAccepted, privacyAccepted) {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiClient.patch("/user/terms/accept", { termsAccepted, privacyAccepted });
}

/**
 * ## Set Transaction PIN
 * POST /api/user/pin
 * Body: { pin }
 * Response: { success }
 */
export async function setTransactionPin({ pin }) {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiClient.post("/user/pin", { pin });
}

/**
 * ## Change Transaction PIN
 * POST /api/user/pin/change
 * Body: { currentPin, newPin, confirmNewPin? }
 * Auth: required (routeProtect). Backend re-validates the current PIN against
 * the stored bcrypt hash and rejects reuse of the current PIN.
 * Response: { success, message, data: { isPinSet } }
 */
export async function changeTransactionPin({ currentPin, newPin, confirmNewPin }) {
  if (USE_MOCK) return mockDelay({ success: true, message: "Transaction PIN changed successfully." });
  return apiClient.post("/user/pin/change", { currentPin, newPin, confirmNewPin });
}

/**
 * ## Forgot Transaction PIN
 * POST /api/user/pin/forgot
 * Body: { email }
 * Public (no session required — member is resetting a forgotten PIN).
 * Response: { success, message }
 */
export async function forgotTransactionPin({ email }) {
  if (USE_MOCK) return mockDelay({ success: true, message: "If an account exists for that email, a PIN reset OTP has been sent." });
  return apiClient.post("/user/pin/forgot", { email });
}

/**
 * ## Reset Transaction PIN
 * POST /api/user/pin/reset
 * Body: { email, otp, newPin }
 * Auth: required — member-bound (authenticated user must own the email).
 * Verifies the OTP (expiry + single-use + attempt limits enforced server-side),
 * hashes the new PIN, clears the recovery authorization, and audits.
 * Response: { success, message }
 */
export async function resetTransactionPin({ email, otp, newPin }) {
  if (USE_MOCK) return mockDelay({ success: true, message: "Transaction PIN reset successfully." });
  return apiClient.post("/user/pin/reset", { email, otp, newPin });
}

/**
 * ## Update Bank Details
 * PUT /api/user/bank-details
 * Body: { bankName, accountName, accountNumber }
 * Response: { success, data: { bankDetails } }
 */
export async function updateBankDetails(bankDetails) {
  if (USE_MOCK) return mockDelay({ success: true, data: { bankDetails } });
  return apiClient.put("/user/bank-details", bankDetails);
}