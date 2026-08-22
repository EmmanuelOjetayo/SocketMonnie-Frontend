import { apiClient } from "./apiClient";
import { mockDelay, USE_MOCK } from "./mockDelay";

/**
 * Search guarantor by referral code.
 * GET /api/guarantors/search/:referralCode
 */
export async function searchGuarantor(referralCode) {
  if (USE_MOCK) {
    return mockDelay({
      success: true,
      guarantor: {
        id: "mock-user-id",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        referralCode,
        tier: "gold",
        profileImage: "",
        netSavings: 250000,
      },
    });
  }

  return apiClient.get(
    `/guarantors/search/${encodeURIComponent(referralCode.trim())}`
  );
}

/**
 * Borrower/Admin
 * Get guarantor attached to a loan.
 * GET /api/guarantors/loan/:loanId
 */
export async function getGuarantorByLoan(loanId) {
  if (USE_MOCK) {
    return mockDelay({
      success: true,
      guarantor: null,
      loan: null,
    });
  }

  return apiClient.get(`/guarantors/loan/${loanId}`);
}

/**
 * Public
 * View guarantor invitation.
 * GET /api/guarantors/verify/:token
 */
export async function getGuarantorRequestByToken(token) {
  return apiClient.get(
    `/guarantors/verify/${token}`,
    {
      auth: false,
    }
  );
}

/**
 * Accept / Reject guarantor invitation (requires logged-in user auth header).
 * POST /api/guarantors/respond
 */
export async function respondToGuarantorRequest({
  token,
  decision,
  ...kyc
}) {
  return apiClient.post(
    "/guarantors/respond",
    {
      token,
      decision,
      ...kyc,
    }
  );
}

/**
 * Get pending guarantor requests for the logged-in user.
 * GET /api/guarantors/pending-requests
 */
export async function getPendingGuarantorRequests() {
  return apiClient.get("/guarantors/pending-requests");
}