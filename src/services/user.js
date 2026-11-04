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
 * Body: FormData { documentType, file, bvn?, nin? }
 * Response: { success, data: { documentType, documentUrl, kycStatus } }
 */
export async function uploadKycDocument(formData) {
  if (USE_MOCK) return mockDelay({ success: true, status: "pending_review" });
  return apiClient.post("/user/kyc", formData);
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
 * ## Update Bank Details
 * PUT /api/user/bank-details
 * Body: { bankName, accountName, accountNumber }
 * Response: { success, data: { bankDetails } }
 */
export async function updateBankDetails(bankDetails) {
  if (USE_MOCK) return mockDelay({ success: true, data: { bankDetails } });
  return apiClient.put("/user/bank-details", bankDetails);
}