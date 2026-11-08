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

/**
 * In-memory CSRF token mirror for cross-origin deployments.
 *
 * On the production topology the frontend (Netlify) and API (Render) are
 * different sites, so `document.cookie` there can NEVER contain the
 * backend-scoped csrfToken cookie — it always reads null, which made
 * every state-changing request persistently 403 in production while
 * same-site localhost kept working. The backend therefore also echoes
 * the fresh token in response bodies (login, verify-otp, 403 misfire),
 * and this module caches it here as the primary source.
 */
let memoryCsrfToken = null;

function setMemoryCsrfToken(token) {
  if (typeof token === "string" && token) {
    memoryCsrfToken = token;
  }
}

/**
 * Totally non-destructive token resolution: memory (stale-proof) ->
 * backend-emitted localStorage mirror -> document.cookie (same-site).
 */
function resolveCsrfToken() {
  if (memoryCsrfToken) return memoryCsrfToken;
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("csrfToken") : null;
    if (stored) return stored;
  } catch {
    // localStorage unavailable (private mode) — cookie fallback still applies.
  }
  return readCookie("csrfToken");
}

/**
 * CSRF bootstrap fetch — GET /api/auth/csrf (public, safe method).
 *
 * Sessions that never log in — the onboarding path register -> verify-otp ->
 * KYC — still need a valid double-submit token before their first
 * state-changing call (personal-info PATCH, KYC FormData upload). Without
 * this bootstrap, exactly those requests fail with CSRF_TOKEN_INVALID
 * while post-login dashboard actions keep working.
 *
 * Fetches only when no token is resolvable; a shared in-flight promise
 * prevents concurrent state-changing calls from racing token issuance
 * (the last-issued cookie would orphan the other calls' header token).
 * Kept in sync with localStorage for page-reload cold starts.
 */
let csrfBootstrapPromise = null;

async function fetchCsrfToken() {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/auth/csrf`,
    { method: "GET", credentials: "include" }
  );
  if (!response.ok) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    return null;
  }
  const token = data?.csrfToken || data?.data?.csrfToken;
  if (token) {
    setMemoryCsrfToken(token);
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("csrfToken", token);
    } catch {
      // localStorage may be unavailable — in-memory token still applies.
    }
  }
  return token || null;
}

/**
 * @param {boolean} [force=false] — skip the cached fast-path and always
 *   fetch. Used on the 403 retry after the backend rotated the cookie:
 *   the freshly issued token is guaranteed to match the new cookie.
 */
async function ensureCsrfToken(force = false) {
  if (!force && resolveCsrfToken()) return resolveCsrfToken();
  if (!force && !csrfBootstrapPromise) {
    csrfBootstrapPromise = fetchCsrfToken().finally(() => {
      csrfBootstrapPromise = null;
    });
  }
  return force ? fetchCsrfToken() : csrfBootstrapPromise;
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

  // CSRF double-submit mirror: the csrfToken (in-memory copy from the
  // last backend response, falling back to the JS-readable cookie on
  // same-site deployments) must be echoed into the X-CSRF-Token header
  // on every state-changing request. When NO token is resolvable — e.g.
  // the onboarding flow's very first FormData upload, which never went
  // through a login — bootstrap one from the public GET /auth/csrf
  // endpoint so the request does not 403.
  let csrfToken = null;
  if (!isSafeMethod) {
    try {
      await ensureCsrfToken();
    } catch {
      // Bootstrap fetch failed (network) — proceed headerless; the 403
      // misfire path below will retry with a fresh token once reachable.
    }
    csrfToken = resolveCsrfToken();
  }

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
  // issues a fresh csrfToken (in the cookie AND in the JSON body) in that
  // response. Retry once, FORCING the freshly issued token into the header
  // so any stale caller-supplied header cannot leak into the retry.
  // Body echo is the primary channel; GET /auth/csrf is the fallback that
  // also works when the deployed backend does not echo the token.
  if (
    response.status === 403 &&
    data?.code === "CSRF_TOKEN_INVALID" &&
    !_isRetry
  ) {
    const freshToken = (await ensureCsrfToken(true)) || readCookie("csrfToken");
    if (freshToken) {
      setMemoryCsrfToken(freshToken);
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem("csrfToken", freshToken);
      } catch {
        // localStorage may be unavailable — in-memory token still applies.
      }
      return request(path, {
        method,
        body,
        headers: { ...(headers || {}), "X-CSRF-Token": freshToken },
        _isRetry: true,
      });
    }
  }

  // Cache any token echoed on success responses (login / verify-otp).
  const bodyToken = data?.data?.csrfToken || data?.csrfToken;
  if (bodyToken) {
    setMemoryCsrfToken(bodyToken);
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem("csrfToken", bodyToken);
    } catch {
      // localStorage may be unavailable — in-memory token still applies.
    }
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
