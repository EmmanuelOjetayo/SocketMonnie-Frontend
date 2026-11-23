import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("resend cooldown hook counts down safely after each sent OTP", () => {
  const hook = read("src/hooks/useResendCooldown.js");

  assert.ok(hook.includes("export const OTP_RESEND_COOLDOWN_SECONDS = 30;"));
  assert.ok(hook.includes("setTimeout"));
  assert.ok(hook.includes("clearTimeout"));
  assert.ok(hook.includes("Math.max(0, value - 1)"));
  assert.ok(hook.includes("export function useResendCooldown"));
});

test("registration and password-reset OTP screens cool down on open and resend", () => {
  for (const rel of ["src/pages/auth/VerifyOtp.jsx", "src/pages/auth/ResetPassword.jsx"]) {
    const source = read(rel);

    assert.ok(source.includes("useResendCooldown"), `${rel} is missing the cooldown hook`);
    assert.ok(source.includes("startCooldown();"), `${rel} never starts a cooldown`);
    assert.ok(source.includes("isCoolingDown"), `${rel} does not disable resend while cooling down`);
    assert.ok(source.includes("`Resend code in ${remaining}s`"), `${rel} does not show the countdown`);
  }
});

test("forgot-password and PIN-reset resend controls share the same cooldown", () => {
  for (const rel of ["src/pages/auth/ForgotPassword.jsx", "src/pages/user/Profile.jsx"]) {
    const source = read(rel);

    assert.ok(source.includes("useResendCooldown"), `${rel} is missing the cooldown hook`);
    assert.ok(source.includes("startCooldown();"), `${rel} never starts a cooldown`);
    assert.ok(source.includes("isCoolingDown"), `${rel} does not disable resend while cooling down`);
    assert.ok(source.includes("`Resend code in ${remaining}s`"), `${rel} does not show the countdown`);
  }
});
