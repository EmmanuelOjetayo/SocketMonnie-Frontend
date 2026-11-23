import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeUser } from "../src/utils/userProfile.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("normalized user state keeps kycSubmitted but drops KYC secrets", () => {
  const user = normalizeUser({
    _id: "user-1",
    kycStatus: "approved",
    kycSubmitted: true,
    nin: "12345678901",
    documentType: "nin",
    documentUrl: "https://res.cloudinary.com/example/kyc.pdf",
    password: "hash",
    transactionPin: "hash",
    pinResetOTP: "hash",
  });

  assert.equal(user.kycStatus, "approved");
  assert.equal(user.kycSubmitted, true);
  for (const field of [
    "nin",
    "documentType",
    "documentUrl",
    "password",
    "transactionPin",
    "pinResetOTP",
  ]) {
    assert.equal(Object.hasOwn(user, field), false, `${field} leaked into user state`);
  }

  // Older API payloads without kycSubmitted still derive the flag, never the
  // document itself.
  const legacy = normalizeUser({ documentUrl: "https://example.com/doc.pdf" });
  assert.equal(legacy.kycSubmitted, true);
  assert.equal(Object.hasOwn(legacy, "documentUrl"), false);
});

test("dashboard derives pending KYC from the sanitized flag", () => {
  const source = read("src/pages/user/Dashboard.jsx");
  assert.ok(source.includes("user?.kycSubmitted === true"));
  assert.ok(!source.includes("user?.documentUrl"), "dashboard still reads a KYC document URL");
  assert.ok(!source.includes("user.documentUrl"), "dashboard still reads a KYC document URL");
});

test("profile gates KYC details behind a backend PIN check", () => {
  const source = read("src/pages/user/Profile.jsx");

  assert.ok(source.includes("viewKycDetails"));
  assert.ok(source.includes("viewKycDetails({ pin: kycPin })"));
  assert.ok(source.includes('type="password"'));
  assert.ok(source.includes("inputMode=\"numeric\""));
  assert.ok(source.includes("kycSubmitted && !kycDetails"));
  assert.ok(source.includes("{kycDetails && ("));

  // Sensitive values come only from the PIN-verified response, never from the
  // persisted user object.
  assert.ok(!source.includes("user?.documentUrl"));
  assert.ok(!source.includes("user.documentUrl"));
  assert.ok(!source.includes("user?.nin"));
  assert.ok(!source.includes("user.nin"));

  const openBlock = source.slice(
    source.indexOf("function openKycModal() {"),
    source.indexOf("function closeKycModal() {")
  );
  const closeBlock = source.slice(
    source.indexOf("function closeKycModal() {"),
    source.indexOf("async function handleKycUpload() {")
  );
  for (const block of [openBlock, closeBlock]) {
    assert.ok(block.includes("setKycPin(\"\")"));
    assert.ok(block.includes("setKycDetails(null)"));
  }

  const failBlock = source.slice(
    source.indexOf("async function handleViewKyc(e) {"),
    source.indexOf("function handleSetPin() {")
  );
  assert.ok(failBlock.includes("setKycDetails(null)"), "failed PIN must hide details");
  assert.ok(!/localStorage|sessionStorage/.test(failBlock), "PIN must not be persisted");
});

test("KYC view service sends only the PIN to the protected endpoint", () => {
  const source = read("src/services/user.js");
  assert.ok(source.includes("export async function viewKycDetails({ pin })"));
  assert.ok(source.includes('apiClient.post("/user/kyc/view", { pin })'));
  assert.ok(!source.includes("userId"), "client must not choose whose KYC to view");
});

test("auth state refreshes from /me on focus, visibility and a light poll", () => {
  const source = read("src/context/AuthContext.jsx");
  assert.ok(source.includes("const refreshUser = useCallback(async () => {"));
  assert.ok(source.includes("await getCurrentUser()"));
  assert.ok(source.includes('window.addEventListener("focus", refreshIfStale)'));
  assert.ok(source.includes('document.addEventListener("visibilitychange", onVisibilityChange)'));
  assert.ok(source.includes("setInterval("));
  assert.ok(source.includes("normalizeUser(fetchedUser)"));
  assert.ok(source.includes("refreshUser,"));
});

test("OTP verification refreshes /me after a successful KYC upload", () => {
  const source = read("src/pages/auth/VerifyOtp.jsx").replace(/\r\n/g, "\n");
  assert.ok(source.includes("const { authenticate, setUser, refreshUser } = useAuth();"));

  const uploadBlock = source.slice(
    source.indexOf("try {\n          const kycRes = await uploadKycDocument(kycFormData);"),
    source.indexOf("} catch (kycErr) {")
  );
  assert.ok(uploadBlock.includes("await refreshUser();"));
  assert.ok(uploadBlock.indexOf("toast.success(\"Identity document uploaded.\")") < uploadBlock.indexOf("await refreshUser();"));
});
