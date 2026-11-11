import { apiClient } from "./apiClient";
import { API_BASE_URL } from "@/constants/config";

/**
 * Get monthly statement summary and transactions filtered by month/year
 * GET /api/reports/monthly?month=&year=
 * Response: { success, statement: { savings, loans, rating, transactions } }
 */
export async function getMonthlyStatement(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/reports/monthly${query ? `?${query}` : ""}`);
}

/**
 * Download statement PDF blob directly from backend matching selected date range
 * GET /api/reports/download-pdf?month=&year=
 * Returns: Blob (PDF)
 * Credentials included so httpOnly cookie is sent with the request.
 */
export async function downloadStatementPdf(params = {}) {
  const month = params.month || new Date().getMonth() + 1;
  const year = params.year || new Date().getFullYear();

  const response = await fetch(
    `${API_BASE_URL}/reports/download-pdf?month=${month}&year=${year}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate PDF statement");
  }

  // Guard against a 200 response that is not a PDF (e.g. an HTML login
  // page served after session expiry) — otherwise a corrupt blob downloads.
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/pdf")) {
    throw new Error("Received an unexpected file format. Please log in again.");
  }

  return await response.blob();
}
