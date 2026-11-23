import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const extractBlock = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return source.slice(start, end + endMarker.length);
};

test("no frontend form or legal copy asks for BVN", () => {
  const sources = [
    "src/pages/user/Profile.jsx",
    "src/pages/auth/Register.jsx",
    "src/pages/auth/VerifyOtp.jsx",
    "src/utils/pendingKyc.js",
    "src/pages/onboarding/PersonalInfo.jsx",
    "src/services/auth.js",
    "src/services/user.js",
    "src/pages/legal/Terms.jsx",
    "src/pages/legal/Privacy.jsx",
  ];

  for (const rel of sources) {
    const source = read(rel);
    assert.ok(!/\bbvn\b/i.test(source), `${rel} still references BVN`);
    assert.ok(!/bank verification number/i.test(source), `${rel} still references bank verification number`);
  }
});

test("NIN remains the national identity input through registration and OTP handoff", () => {
  assert.ok(read("src/pages/user/Profile.jsx").includes('label="NIN (11 Digits)'));
  assert.ok(read("src/pages/auth/Register.jsx").includes('name="nin"'));
  assert.ok(read("src/pages/auth/Register.jsx").includes('national_id: "nin"'));
  assert.ok(read("src/pages/auth/VerifyOtp.jsx").includes('kycFormData.append("nin", pendingKyc.nin || "")'));
  assert.ok(read("src/services/user.js").includes("nin"));
});

test("registration payload contains no BVN field", () => {
  const registerSource = read("src/pages/auth/Register.jsx");
  const payload = extractBlock(registerSource, "const payload = {", "};");

  assert.ok(!/\bbvn\b/i.test(payload));
  assert.ok(payload.includes("dateOfBirth: formData.dob"));
  assert.ok(payload.includes("termsAccepted: formData.termsAccepted === true"));
});

test("OTP submission sends the retained NIN only, never BVN", () => {
  const otpSource = read("src/pages/auth/VerifyOtp.jsx");
  const formData = extractBlock(
    otpSource,
    "const kycFormData = new FormData();",
    "uploadKycDocument(kycFormData);",
  );

  assert.ok(!/\bbvn\b/i.test(formData));
  assert.ok(formData.includes('kycFormData.append("documentType", pendingKyc.documentType || "nin")'));
  assert.ok(formData.includes('kycFormData.append("nin", pendingKyc.nin || "")'));
  assert.ok(formData.includes('kycFormData.append("file", pendingKyc.file)'));
});
