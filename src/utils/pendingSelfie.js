/**
 * In-memory handoff for the onboarding selfie.
 *
 * Register collects the selfie BEFORE the account gets an auth cookie
 * (Register → OTP verify → auth). The protected avatar endpoint can only be
 * called after VerifyOtp authenticates, so the File is stashed here and
 * uploaded right after OTP verification. Module state dies on full page
 * refresh — acceptable: if the user refreshes at the OTP step, no avatar
 * is uploaded (never a blob URL persisted, never a broken state).
 */
let pendingSelfie = null;

export function setPendingSelfie(file) {
  pendingSelfie = file || null;
}

export function takePendingSelfie() {
  const file = pendingSelfie;
  pendingSelfie = null;
  return file;
}
