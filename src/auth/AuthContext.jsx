// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { getCurrentSession, signIn as cognitoSignIn, signOut as cognitoSignOut } from "./cognitoClient";

/**
 * Auto-logout after 1 hour of inactivity.
 * - Inactivity is tracked by user interactions (mouse, keyboard, scroll, touch)
 * - When timeout triggers, we clear tokens and sign out locally, then send user to /#/auth
 */
const INACTIVITY_MS = 60 * 60 * 1000;

const AuthContext = createContext(null);

const COOKIE_OPTIONS = {
  // 1 hour cookie lifetime by default; if you extend via refresh token later, adjust here.
  expires: 1 / 24, // 1 hour
  sameSite: "Lax",
  secure: true, // required on https (GitHub Pages). For localhost, browsers may ignore secure cookies.
};

function setTokensFromSession(session) {
  if (!session) return;
  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const refreshToken = session.getRefreshToken().getToken();

  Cookies.set("id_token", idToken, COOKIE_OPTIONS);
  Cookies.set("access_token", accessToken, COOKIE_OPTIONS);
  Cookies.set("refresh_token", refreshToken, COOKIE_OPTIONS);
}

function clearTokens() {
  Cookies.remove("id_token");
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

function useInactivityLogout({ enabled, onTimeout }) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (!enabled) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onTimeout(), INACTIVITY_MS);
  };

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  const isAuthenticated = !!session;

  const refreshFromCognito = async () => {
    try {
      const s = await getCurrentSession();
      if (s && s.isValid()) {
        setSession(s);
        setTokensFromSession(s);
      } else {
        setSession(null);
        clearTokens();
      }
    } catch {
      setSession(null);
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFromCognito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async ({ redirect = true } = {}) => {
    try {
      cognitoSignOut();
    } finally {
      setSession(null);
      clearTokens();
      if (redirect) window.location.hash = "#/auth";
    }
  };

  const login = async (username, password) => {
    const { session: s } = await cognitoSignIn(username, password);
    setSession(s);
    setTokensFromSession(s);
    window.location.hash = "#/";
    return s;
  };

  // Auto logout after inactivity
  useInactivityLogout({
    enabled: isAuthenticated,
    onTimeout: () => logout({ redirect: true }),
  });

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      session,
      login,
      logout,
      refreshFromCognito,
    }),
    [isLoading, isAuthenticated, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
