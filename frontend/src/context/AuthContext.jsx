import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  login as apiLogin,
  logout as apiLogout,
  refreshAccessToken,
  setAccessToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = getAccessToken();
      // #region agent log
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
          location: "AuthContext.jsx:boot",
          message: "Auth boot",
          data: {
            hasAccessToken: Boolean(existing),
            willRefreshOnlyIfMissing: !existing,
            origin: typeof window !== "undefined" ? window.location.origin : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!existing) {
        try {
          await refreshAccessToken();
          if (!cancelled) setToken(getAccessToken());
        } catch {
          setAccessToken(null);
          if (!cancelled) setToken(null);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    setToken(data.access_token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        ready,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
