import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("payment result navigation is webhook-only", () => {
  const nav = read("src/utils/paymentResultNav.js");

  assert.ok(!nav.includes("verify"));
  assert.ok(!nav.includes("/verify"));
  assert.ok(nav.includes("GET /api/payments/status/:reference"));
  assert.ok(nav.includes("Only the signed server-to-server webhook"));
  assert.ok(nav.includes("Pending stays pending"));
});

test("checkout pages persist only the reference and never invoke verify", () => {
  const pages = [
    "src/pages/user/SavingsDeposit.jsx",
    "src/pages/user/MembershipFee.jsx",
    "src/pages/user/Minutes.jsx",
    "src/pages/user/LoanRepay.jsx",
  ];

  for (const page of pages) {
    const source = read(page);
    assert.ok(!source.includes("verifyDeposit("), page);
    assert.ok(!source.includes("verifyMembershipFee("), page);
    assert.ok(!source.includes("verifyMinutesContribution("), page);
    assert.ok(!source.includes("verifyLoanRepayment("), page);
    assert.ok(!source.includes("verify:"), page);
    assert.ok(source.includes("settleAndNavigate({"), page);
  }
});

test("payment and savings service modules expose no callback verifier", () => {
  const payments = read("src/services/payments.js");
  const savings = read("src/services/savings.js");
  const loans = read("src/services/loans.js");

  assert.ok(!payments.includes("verifyDeposit"));
  assert.ok(!payments.includes("verifyLoanRepayment"));
  assert.ok(!payments.includes("verifyMinutesContribution"));
  assert.ok(!payments.includes("paymentCallback"));
  assert.ok(!payments.includes("deposit/callback"));
  assert.ok(!savings.includes("verifyMembershipFee"));
  assert.ok(savings.includes('apiClient.post("/membership/initialize")'));
  assert.ok(!savings.includes("/savings/membership-fee/initialize"));
  assert.ok(!loans.includes("repay/verify"));
  assert.ok(payments.includes("Read-only authoritative transaction status"));
});

test("loan repayment overpayment value is defined before render", () => {
  const source = read("src/pages/user/LoanRepay.jsx");

  assert.ok(
    source.includes(
      "const excessAmount = Math.max(0, paymentAmount - Number(loan.remainingBalance || 0));"
    )
  );
  assert.ok(source.includes("excessAmount > 0"));
  assert.ok(source.includes("refund_review"));
});
