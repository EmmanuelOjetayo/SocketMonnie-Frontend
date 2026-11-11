import { useCallback, useEffect, useRef, useState } from "react";
import { getPaymentStatus } from "@/services/payments";

/**
 * Poll the backend for the authoritative payment status of a reference.
 *
 * Design rules (backend = source of truth):
 *  - Fetch immediately, then every `intervalMs` up to `maxAttempts`.
 *  - Stop polling only on a terminal status ("successful" | "failed").
 *  - `refresh()` lets the user manually re-check at any time.
 *  - 404 (transaction not found for this account) is terminal too — no
 *    amount of retrying will conjure a record, and it must not be shown as
 *    a successful payment.
 *  - Poll cleanup on unmount: navigating away never leaves a dangling timer.
 *
 * @returns {{
 *   transaction: object|null,  // authoritative receipt when confirmed
 *   status: "idle"|"checking"|"pending"|"successful"|"failed"|"not_found",
 *   isConfirming: boolean,     // true while any request is in flight
 *   isTerminal: boolean,       // true when polling has stopped
 *   attempts: number,
 *   error: string|null,
 *   refresh: () => void,
 * }}
 */
export function usePaymentConfirmation(reference, {
  enabled = true,
  intervalMs = 3500,
  maxAttempts = 8,
} = {}) {
  const [transaction, setTransaction] = useState(null);
  const [status, setStatus] = useState("idle");
  const [isConfirming, setIsConfirming] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(null);

  const referenceRef = useRef(reference);
  referenceRef.current = reference;
  const attemptsRef = useRef(0);
  const stoppedRef = useRef(false);
  const timerRef = useRef(null);

  const TERMINAL = ["successful", "failed", "not_found"];

  const check = useCallback(async () => {
    const ref = referenceRef.current;
    if (!ref || stoppedRef.current) return;

    setIsConfirming(true);
    setError(null);
    try {
      const res = await getPaymentStatus(ref);
      const data = res?.data || null;

      if (!data) throw new Error("Empty status response");

      setTransaction(data);
      setStatus(data.status);

      if (data.status === "failed") {
        setError("Payment failed. If you were charged, contact support with your reference.");
      }

      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);

      if (TERMINAL.includes(data.status)) {
        stoppedRef.current = true;
        return;
      }

      // Keep polling until the terminal status or the attempt cap.
      if (attemptsRef.current >= maxAttempts) {
        stoppedRef.current = true;
        return;
      }
      timerRef.current = setTimeout(check, intervalMs);
    } catch (err) {
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);

      // 404 → not found for this account: terminal, never fabricate success.
      const status404 = err?.status === 404 || err?.response?.status === 404;
      if (status404) {
        stoppedRef.current = true;
        setStatus("not_found");
        setError("We could not find this transaction for your account.");
        return;
      }

      // Network/transient errors: keep polling (never false-fail on a blip),
      // unless the attempt cap is reached.
      if (attemptsRef.current >= maxAttempts) {
        stoppedRef.current = true;
        setStatus((prev) => (prev === "idle" ? "pending" : prev));
        setError("We are still confirming your payment. You can refresh to check again.");
        return;
      }
      timerRef.current = setTimeout(check, intervalMs);
    } finally {
      setIsConfirming(false);
    }
  }, [intervalMs, maxAttempts]);

  useEffect(() => {
    if (!enabled || !reference) {
      setStatus("idle");
      return undefined;
    }
    stoppedRef.current = false;
    attemptsRef.current = 0;
    setTransaction(null);
    setStatus("checking");
    setError(null);
    check();
    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, reference, check]);

  return {
    transaction,
    status,
    isConfirming,
    isTerminal: TERMINAL.includes(status) || attempts >= maxAttempts,
    attempts,
    error,
    refresh: check,
  };
}
