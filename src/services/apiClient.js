import { API_BASE_URL } from "@/constants/config";

/**
 * Thin fetch wrapper every service module builds on.
 * - Sends httpOnly cookies automatically via credentials: 'include'.
 * - Auto-detects FormData and leaves Content-Type header to the browser.
 * - Throws a normalized Error with `.status` and `.data` for callers to catch.
 */
/**
 * Read a non-httpOnly cookie value (e.g. the CSRF double-submit token).
 */
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

async function request(path, { method = "GET", body, headers, _isRetry } = {}) {
  // Check if body is FormData (e.g., file uploads)
  const isFormData = body instanceof FormData;

  // Build headers dynamically
  const defaultHeaders = {
    // Only set Content-Type to application/json if NOT uploading FormData
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...headers,
  };

  // Standardize path formatting with leading slash
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}${formattedPath}`;

  const requestMethod = method.toUpperCase();
  const isSafeMethod = SAFE_METHODS.has(requestMethod);

  // CSRF double-submit mirror: the csrfToken cookie (JS-readable) must be
  // echoed into the X-CSRF-Token header on every state-changing request.
  const csrfToken = !isSafeMethod ? readCookie("csrfToken") : null;

  const response = await fetch(targetUrl, {
    method,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(csrfToken && { "X-CSRF-Token": csrfToken }),
    },
    // Don't JSON.stringify if body is FormData
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g. 204 No Content)
  }

  // CSRF bootstrap: the very first state-changing request after deploy (or a
  // fresh login) can be answered with 403 CSRF_TOKEN_INVALID — the backend
  // issues a fresh csrfToken cookie in that response. Retry once.
  if (
    response.status === 403 &&
    data?.code === "CSRF_TOKEN_INVALID" &&
    !_isRetry
  ) {
    return request(path, { method, body, headers, _isRetry: true });
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
