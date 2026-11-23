import { useCallback, useEffect, useState } from "react";

/** Default wait between OTP sends. Keeps resend usable without mail spam. */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

/**
 * Small countdown timer for OTP resend controls.
 *
 * The caller starts the cooldown only after a code has actually been sent
 * (or when an OTP screen opens for a code sent by the previous screen).
 */
export function useResendCooldown(seconds = OTP_RESEND_COOLDOWN_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return undefined;

    const timer = setTimeout(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  const startCooldown = useCallback(() => setRemaining(seconds), [seconds]);

  return {
    remaining,
    isCoolingDown: remaining > 0,
    startCooldown,
  };
}
