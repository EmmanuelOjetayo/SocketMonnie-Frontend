import { formatNaira } from "./format.js";
import { receiptFilename } from "./receiptData.js";

/**
 * SocketMonnie receipt → real PDF (vector, not a screenshot).
 *
 * jsPDF was already a project dependency, so no new package is introduced.
 * Text stays selectable and searchable, the file stays small, and the
 * layout is deterministic on desktop and mobile alike.
 *
 * Financial integrity: every value printed here comes from the canonical
 * receipt model, which is built from a backend record. The status line
 * always mirrors the transaction's real state — a pending transaction
 * produces a PENDING receipt, never a successful one.
 */

const COLORS = {
  header: "#131e49",
  headerSoft: "#a9b4e0",
  ink: "#090f24",
  accent: "#3557d4",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e4e8f7",
  surface: "#f7f9ff",
  surfaceBorder: "#dee3f9",
};

const STATUS_STYLE = {
  successful: { label: "SUCCESSFUL", bg: "#e7f8ef", fg: "#12b76a" },
  pending: { label: "PENDING", bg: "#fef4e2", fg: "#b45309" },
  failed: { label: "FAILED", bg: "#fdeaea", fg: "#f04438" },
};

const PAGE = {
  margin: 48,
  headerHeight: 124,
  footerHeight: 64,
};

/**
 * jsPDF's standard fonts use WinAnsi encoding, which has no glyph for the
 * Naira sign (U+20A6) — passing it through produces corrupted bytes in the
 * document. Currency is therefore written as "NGN" (matching the existing
 * SocketMonnie statement PDF) and any character outside WinAnsi is
 * normalised before it reaches the page.
 */
function pdfSafe(value) {
  return String(value ?? "")
    .replace(/₦/g, "NGN ")
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/** Truncate a long value to two lines so a row can never overflow. */
function fitValue(doc, value, maxWidth) {
  const lines = doc.splitTextToSize(pdfSafe(value), maxWidth);
  if (lines.length <= 2) return lines;
  const clipped = [lines[0], `${lines[1].slice(0, Math.max(0, lines[1].length - 1))}...`];
  return clipped;
}

/**
 * Build the receipt PDF.
 *
 * jsPDF is loaded lazily so the PDF library is only fetched by members who
 * actually export a receipt — it never weighs down the app bundle.
 */
export async function buildReceiptPdf(data) {
  if (!data) throw new Error("Nothing to download — receipt data is missing.");

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE.margin * 2;
  const status = STATUS_STYLE[data.status] || STATUS_STYLE.pending;

  let y = 0;

  const drawBrandHeader = (isContinuation) => {
    doc.setFillColor(COLORS.header);
    doc.rect(0, 0, pageWidth, PAGE.headerHeight, "F");

    doc.setTextColor("#ffffff");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SocketMonnie", PAGE.margin, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.headerSoft);
    doc.text(
      isContinuation ? "Payment Receipt (continued)" : "Payment Receipt",
      PAGE.margin,
      70
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Cooperative savings, loans and member payments",
      PAGE.margin,
      86
    );

    // Status pill (top-right)
    const label = status.label;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const pillWidth = Math.max(72, doc.getTextWidth(label) + 26);
    const pillHeight = 22;
    const pillX = pageWidth - PAGE.margin - pillWidth;
    const pillY = 40;
    doc.setFillColor(status.bg);
    doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 11, 11, "F");
    doc.setTextColor(status.fg);
    doc.text(label, pillX + pillWidth / 2, pillY + 14.5, { align: "center" });

    y = PAGE.headerHeight;
  };

  const drawAmountBlock = () => {
    doc.setTextColor(COLORS.faint);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(
      data.direction === "debit" ? "AMOUNT DEBITED" : "AMOUNT RECEIVED",
      PAGE.margin,
      y + 18
    );

    doc.setTextColor(COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(pdfSafe(formatNaira(data.amount, { decimals: 2 })), PAGE.margin, y + 48);

    doc.setTextColor(COLORS.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(pdfSafe(data.typeLabel), PAGE.margin, y + 68);

    if (data.occurredAtLabel) {
      doc.setTextColor(COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(pdfSafe(data.occurredAtLabel), PAGE.margin, y + 84);
    }

    y += 104;

    doc.setDrawColor(COLORS.surfaceBorder);
    doc.setLineWidth(1);
    doc.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
    y += 26;
  };

  const drawDetailsHeading = () => {
    doc.setTextColor(COLORS.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("TRANSACTION DETAILS", PAGE.margin, y);
    y += 16;
  };

  const drawRow = (row) => {
    const labelX = PAGE.margin;
    const valueX = pageWidth - PAGE.margin;
    const valueWidth = contentWidth * 0.55;
    const labelWidth = contentWidth - valueWidth - 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    const labelLines = doc.splitTextToSize(pdfSafe(row.label), labelWidth);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const valueLines = fitValue(doc, row.value, valueWidth);

    const rowHeight = Math.max(labelLines.length, valueLines.length) * 12 + 12;

    // New page when the row (plus its separator) no longer fits.
    if (y + rowHeight > pageHeight - PAGE.footerHeight) {
      doc.addPage();
      drawBrandHeader(true);
      y += 16;
    }

    let textY = y + 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    labelLines.slice(0, 2).forEach((line) => {
      doc.text(line, labelX, textY);
      textY += 12;
    });

    let valueY = y + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLORS.ink);
    if (row.status === "successful") doc.setTextColor("#12b76a");
    if (row.status === "pending") doc.setTextColor("#b45309");
    if (row.status === "failed") doc.setTextColor("#f04438");
    valueLines.forEach((line) => {
      doc.text(line, valueX, valueY, { align: "right" });
      valueY += 12;
    });

    y += rowHeight;
    doc.setDrawColor(COLORS.line);
    doc.setLineWidth(0.6);
    doc.line(PAGE.margin, y, pageWidth - PAGE.margin, y);
  };

  const drawFooter = () => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);
      const footerY = pageHeight - PAGE.footerHeight + 18;

      doc.setDrawColor(COLORS.surfaceBorder);
      doc.setLineWidth(0.8);
      doc.line(PAGE.margin, footerY - 16, pageWidth - PAGE.margin, footerY - 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(COLORS.faint);
      doc.text(
        pdfSafe(
          "Generated from your SocketMonnie account records. Amounts in Nigerian Naira (NGN)."
        ),
        PAGE.margin,
        footerY
      );

      const generated = new Date(data.generatedAt || Date.now()).toLocaleString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(pdfSafe(`Generated: ${generated}`), PAGE.margin, footerY + 12);
      doc.text(
        `Page ${page} of ${total}`,
        pageWidth - PAGE.margin,
        footerY,
        { align: "right" }
      );
    }
  };

  drawBrandHeader(false);
  drawAmountBlock();
  drawDetailsHeading();

  (data.rows || []).forEach(drawRow);

  if (!data.rows || data.rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    doc.text("No further details are available for this transaction.", PAGE.margin, y + 12);
  }

  drawFooter();

  return doc;
}

/**
 * Download the receipt as a PDF.
 *
 * @param {object} data canonical receipt model
 * @param {object} [options]
 * @param {string} [options.filename]
 * @returns {Promise<string>} the filename used
 */
export async function downloadReceiptPdf(data, options = {}) {
  const doc = await buildReceiptPdf(data);
  const filename = options.filename || receiptFilename(data?.reference, data?.category);
  doc.save(filename);
  return filename;
}

/** The receipt as a Blob (used by the native share sheet on mobile). */
export async function receiptPdfBlob(data) {
  const doc = await buildReceiptPdf(data);
  return doc.output("blob");
}
