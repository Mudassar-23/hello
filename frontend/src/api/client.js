const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

const ACCESS_KEY = "portfolio_access_token";

export function getApiUrl() {
  return API_URL;
}

export function mediaUrl(path) {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(ACCESS_KEY, token);
  else sessionStorage.removeItem(ACCESS_KEY);
}

async function parseError(res) {
  try {
    const data = await res.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
    return res.statusText || "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function apiFetch(path, options = {}, _retried = false) {
  const headers = new Headers(options.headers || {});
  if (
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type") &&
    options.body
  ) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // #region agent log
  if (res.status === 401) {
    fetch("http://127.0.0.1:7248/ingest/5e5f19b9-bf0f-455d-a770-af37ab55c682", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "291d6d",
      },
      body: JSON.stringify({
        sessionId: "291d6d",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "client.js:apiFetch:401",
        message: "API returned 401",
        data: {
          path,
          method: options.method || "GET",
          hasToken: Boolean(token),
          tokenLen: token ? token.length : 0,
          retried: _retried,
          origin: typeof window !== "undefined" ? window.location.origin : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  if (res.status === 204) return null;

  // Auto-refresh: on 401, try refreshing the access token once and retry
  if (res.status === 401 && !_retried && path !== "/api/auth/login" && path !== "/api/auth/refresh") {
    try {
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.access_token);
        return apiFetch(path, options, true);
      }
    } catch {
      // refresh failed — fall through to error below
    }
    // refresh didn't work — clear token and throw
    setAccessToken(null);
  }

  if (!res.ok) {
    const message = await parseError(res);
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) return res.json();
  return res.text();
}

export async function login(username, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAccessToken(data.access_token);
  return data;
}

export async function refreshAccessToken() {
  const data = await apiFetch("/api/auth/refresh", { method: "POST" });
  setAccessToken(data.access_token);
  return data;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  setAccessToken(null);
}
