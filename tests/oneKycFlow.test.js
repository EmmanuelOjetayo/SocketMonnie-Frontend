import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const extractBlock = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return source.slice(start, end + endMarker.length);
};

test("the duplicate post-OTP KYC screen is removed", () => {
  assert.equal(exists("src/pages/onboarding/KycUpload.jsx"), false);

  const routeSource = read("src/routes/index.jsx");
  assert.ok(!routeSource.includes("KycUpload"));
  assert.ok(!routeSource.includes("ONBOARDING_KYC"));

  const routeConstants = read("src/constants/routes.js");
  assert.ok(!routeConstants.includes("ONBOARDING_KYC"));

  const otpSource = read("src/pages/auth/VerifyOtp.jsx");
  assert.ok(!otpSource.includes("ROUTES.ONBOARDING_KYC"));
  assert.ok(!otpSource.includes("KYC Setup"));
});

test("register stashes the single KYC payload for post-OTP persistence", () => {
  const source = read("src/pages/auth/Register.jsx");
  const stash = extractBlock(source, "await setPendingKyc({", "});");

  assert.ok(source.includes("const KYC_DOCUMENT_TYPE"));
  assert.ok(source.includes('national_id: "nin"'));
  assert.ok(stash.includes('documentType: KYC_DOCUMENT_TYPE[formData.idType] || "nin"'));
  assert.ok(stash.includes("nin: formData.nin"));
  assert.ok(stash.includes("file: idFile"));
  assert.ok(source.includes('toast.error("Please enter a valid 11-digit NIN")'));
});

test("pending KYC handoff keeps the real file in a dedicated one-shot record", () => {
  const kycStore = read("src/utils/pendingKyc.js");
  assert.ok(kycStore.includes("const DB_VERSION = 2"));
  assert.ok(kycStore.includes('"pending_kyc"'));
  assert.ok(kycStore.includes('const RECORD_KEY = "kyc"'));
  assert.ok(kycStore.includes("export async function setPendingKyc"));
  assert.ok(kycStore.includes("export async function takePendingKyc"));

  // Both utilities upgrade the same DB so neither can create a partial schema.
  const selfieStore = read("src/utils/pendingSelfie.js");
  assert.ok(selfieStore.includes("const DB_VERSION = 2"));
  assert.ok(selfieStore.includes('"pending_kyc"'));
});

test("OTP verification finishes KYC and goes straight to Create PIN", () => {
  const source = read("src/pages/auth/VerifyOtp.jsx");

  assert.ok(source.includes("await takePendingKyc()"));
  assert.ok(source.includes("uploadKycDocument(kycFormData)"));
  assert.ok(source.includes("Create PIN"));

  const transition = source.slice(source.indexOf('localStorage.removeItem("user_email");'));
  assert.ok(transition.includes('navigate(ROUTES.ONBOARDING_CREATE_PIN || "/onboarding/create-pin", { replace: true });'));
  assert.ok(!transition.includes("ROUTES.ONBOARDING_KYC"));
});
