/**
 * Central user-profile normalization — the single source of truth for the
 * profile-picture URL exposed to the app.
 *
 * Canonical API/frontend field: `avatarUrl`
 * Legacy backend stores: `selfieUrl` / `profileImage` / `profilePicture`
 *
 * Applied at the AuthContext boundary (login, OTP verify, session refresh)
 * so TopHeader, Profile, and GuarantorVerify never scatter per-field
 * fallbacks. Legacy records continue to display correctly.
 */
// KYC details are fetched only through the PIN-protected view endpoint. Keep
// them out of the global auth state even if an older API response still sends
// them; only the non-sensitive `kycSubmitted` flag is retained.
const FRONTEND_SENSITIVE_FIELDS = [
  "nin",
  "documentUrl",
  "documentType",
  "password",
  "transactionPin",
  "pinResetOTP",
  "pinResetOTPExpiresAt",
];

export function normalizeUser(data) {
  if (!data || typeof data !== "object") return data;
  const avatarUrl =
    data.avatarUrl || data.selfieUrl || data.profilePicture || data.profileImage || null;
  const kycSubmitted = data.kycSubmitted ?? Boolean(data.documentUrl);
  const safe = { ...data };
  for (const field of FRONTEND_SENSITIVE_FIELDS) delete safe[field];

  return {
    ...safe,
    kycSubmitted,
    avatarUrl,
    selfieUrl: data.selfieUrl || avatarUrl,
  };
}
