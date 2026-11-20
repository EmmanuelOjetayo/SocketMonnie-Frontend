import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("no frontend form or legal copy asks for BVN", () => {
  const sources = [
    "src/pages/user/Profile.jsx",
    "src/pages/auth/Register.jsx",
    "src/pages/onboarding/KycUpload.jsx",
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
