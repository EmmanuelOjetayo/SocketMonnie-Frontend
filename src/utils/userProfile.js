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
export function normalizeUser(data) {
  if (!data || typeof data !== "object") return data;
  const avatarUrl =
    data.avatarUrl || data.selfieUrl || data.profilePicture || data.profileImage || null;
  return {
    ...data,
    avatarUrl,
    selfieUrl: data.selfieUrl || avatarUrl,
  };
}
