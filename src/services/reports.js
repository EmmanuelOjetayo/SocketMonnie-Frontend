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
 */
export async function downloadStatementPdf(params = {}) {
  const month = params.month || new Date().getMonth() + 1;
  const year = params.year || new Date().getFullYear();
  const token = localStorage.getItem("socketmoni_token");

  const response = await fetch(
    `${API_BASE_URL}/reports/download-pdf?month=${month}&year=${year}`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate PDF statement");
  }

  return await response.blob();
}