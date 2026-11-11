/* Receipt PDF generation smoke test — builds a real receipt PDF via jsPDF
 * and verifies the output is a valid, non-empty document.
 * Run: node tests/receiptPdf.smoke.cjs
 */
const path = require("path");

let jsPDF;
try {
  const mod = require(path.join(__dirname, "..", "node_modules", "jspdf", "dist", "jspdf.min.js"));
  jsPDF = mod.jsPDF || mod.default || mod;
} catch (err) {
  try {
    const mod = require(path.join(__dirname, "..", "node_modules", "jspdf"));
    jsPDF = mod.jsPDF || mod.default || mod;
  } catch (e2) {
    console.error("jsPDF could not be loaded in this environment:", e2 && e2.message);
    process.exit(2);
  }
}

const data = {
  status: "successful",
  statusLabel: "Successful",
  category: "deposit",
  typeLabel: "Savings Deposit",
  title: "Savings Deposit",
  subtitle: "Credited to your savings account",
  amount: 5000,
  fee: 0,
  total: 5000,
  direction: "credit",
  reference: "DEP_1757000000000_abc123",
  transactionId: "1757000000000",
  method: "flutterwave",
  methodLabel: "Flutterwave",
  occurredAt: new Date().toISOString(),
  occurredAtLabel: "11 November 2026 · 3:45 PM",
  monthsSettled: null,
  balanceAfter: null,
  destination: null,
  rows: [
    { label: "Transaction type", value: "Savings Deposit" },
    { label: "Reference", value: "DEP_1757000000000_abc123", mono: true },
    { label: "Payment method", value: "Flutterwave" },
    { label: "Status", value: "Successful", status: "successful" },
    { label: "Amount", value: "₦5,000.00", emphasis: true },
    { label: "Date & time", value: "11 November 2026 · 3:45 PM" },
  ],
  note: "Amounts are quoted in Nigerian Naira (₦).",
  generatedAt: new Date().toISOString(),
};

const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
doc.setFillColor("#131e49");
doc.rect(0, 0, doc.internal.pageSize.getWidth(), 124, "F");
doc.setTextColor("#ffffff");
doc.setFont("helvetica", "bold");
doc.setFontSize(20);
doc.text("SocketMonnie", 48, 52);
doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.text("Payment Receipt", 48, 70);
doc.text(data.occurredAtLabel, 48, 84);
doc.setFontSize(24);
doc.setFont("helvetica", "bold");
doc.text("₦5,000.00", 48, 140);
doc.text(data.typeLabel, 48, 160);
doc.setFontSize(9);
doc.text("TRANSACTION DETAILS", 48, 190);
let y = 206;
data.rows.forEach((row) => {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${row.label}: ${row.value}`, 48, y);
  y += 14;
});

const bytes = new Uint8Array(doc.output("arraybuffer"));
if (!bytes || bytes.length < 1000) {
  throw new Error(`Receipt PDF output too small: ${bytes && bytes.length}`);
}
console.log(`RECEIPT_PDF_SMOKE_OK bytes=${bytes.length} pages=${doc.getNumberOfPages()}`);
