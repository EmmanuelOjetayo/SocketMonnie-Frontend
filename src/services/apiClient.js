import { API_BASE_URL } from "@/constants/config";

/**
 * Thin fetch wrapper every service module builds on.
 * - Attaches JSON headers + Bearer token automatically.
 * - Auto-detects FormData and leaves Content-Type header to the browser.
 * - Throws a normalized Error with `.status` and `.data` for callers to catch.
 */
async function request(path, { method = "GET", body, headers, auth = true } = {}) {
  const token = auth ? localStorage.getItem("socketmoni_token") : null;

  // Check if body is FormData (e.g., file uploads)
  const isFormData = body instanceof FormData;

  // Build headers dynamically
  const defaultHeaders = {
    // Only set Content-Type to application/json if NOT uploading FormData
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  // Standardize path formatting with leading slash
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}${formattedPath}`;

  const response = await fetch(targetUrl, {
    method,
    headers: defaultHeaders,
    // Don't JSON.stringify if body is FormData
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. 204 No Content)
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};