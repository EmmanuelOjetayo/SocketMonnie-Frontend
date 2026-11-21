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
    "src/pages/onboarding/KycUpload.jsx",
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

test("NIN remains the national identity input across registration and KYC", () => {
  assert.ok(read("src/pages/user/Profile.jsx").includes('label="NIN (11 Digits)'));
  assert.ok(read("src/pages/auth/Register.jsx").includes('name="nin"'));
  assert.ok(read("src/pages/onboarding/KycUpload.jsx").includes('placeholder="NIN (11 digits)"'));
  assert.ok(read("src/services/user.js").includes("nin"));
});

test("registration payload contains no BVN field", () => {
  const registerSource = read("src/pages/auth/Register.jsx");
  const payload = extractBlock(registerSource, "const payload = {", "};");

  assert.ok(!/\bbvn\b/i.test(payload));
  assert.ok(payload.includes("dateOfBirth: formData.dob"));
  assert.ok(payload.includes("termsAccepted: formData.termsAccepted === true"));
});

test("onboarding KYC submission sends NIN only, never BVN", () => {
  const kycSource = read("src/pages/onboarding/KycUpload.jsx");
  const formData = extractBlock(kycSource, "const formData = new FormData();", "uploadKycDocument(formData);");

  assert.ok(!/\bbvn\b/i.test(formData));
  assert.ok(formData.includes('formData.append("documentType", docType)'));
  assert.ok(formData.includes('formData.append("nin", nin)'));

  const docOptions = extractBlock(kycSource, "{ id: \"nin\"", "].map((type) =>");
  assert.ok(!/\bbvn\b/i.test(docOptions));
});
