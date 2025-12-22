// src/auth/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  confirmForgotPassword as cognitoConfirmForgotPassword,
  confirmSignUp as cognitoConfirmSignUp,
  forgotPassword as cognitoForgotPassword,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  signUp as cognitoSignUp,
  getCurrentSession,
} from "./cognitoClient";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";

/**
 * Auto-logout after 60 minutes of inactivity.
 * - Tracked by user interactions (mouse, keyboard, scroll, touch)
 * - When timeout triggers, we sign out locally and send user to /#/auth
 */
const INACTIVITY_MS = 60 * 60 * 1000;

const AuthContext = createContext(null);

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

function parseAllowedGroups() {
  const raw = (import.meta.env.VITE_ALLOWED_GROUPS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getGroupsFromSession(session) {
  try {
    const payload = session?.getIdToken?.()?.payload || {};
    const groups = payload["cognito:groups"];
    if (Array.isArray(groups)) return groups;
    return [];
  } catch {
    return [];
  }
}

function setSessionTokens(session) {
  // Store tokens in sessionStorage so they survive refresh but not tab close.
  try {
    const idToken = session?.getIdToken?.()?.getJwtToken?.();
    const accessToken = session?.getAccessToken?.()?.getJwtToken?.();
    if (idToken) window.sessionStorage.setItem("id_token", idToken);
    if (accessToken) window.sessionStorage.setItem("access_token", accessToken);
  } catch {
    // ignore
  }
}

function clearSessionTokens() {
  window.sessionStorage.removeItem("id_token");
  window.sessionStorage.removeItem("access_token");
}

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("");

  const allowedGroups = useMemo(() => parseAllowedGroups(), []);
  const userGroups = useMemo(() => (session ? getGroupsFromSession(session) : []), [session]);

  const isAuthenticated = !!session;
  const isAuthorized = useMemo(() => {
    if (!allowedGroups.length) return true;
    return userGroups.some((g) => allowedGroups.includes(g));
  }, [allowedGroups, userGroups]);

  const refreshFromCognito = async () => {
    try {
      const s = await getCurrentSession();
      if (s && s.isValid()) {
        setSession(s);
        setSessionTokens(s);
      } else {
        setSession(null);
        clearSessionTokens();
      }
    } catch {
      setSession(null);
      clearSessionTokens();
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
      clearSessionTokens();
      if (redirect) window.location.hash = "#/auth";
    }
  };

  const signIn = async (email, password) => {
    setStatus("");
    const { session: s } = await cognitoSignIn(email, password);
    setSession(s);
    setSessionTokens(s);
    return s;
  };

  const signUp = async (fullName, email, password) => {
    setStatus("");
    const attrs = [];
    if (fullName) {
      attrs.push(new CognitoUserAttribute({ Name: "name", Value: fullName }));
    }
    await cognitoSignUp(email, password, attrs);
    return true;
  };

  const verify = async (email, code) => {
    setStatus("");
    await cognitoConfirmSignUp(email, code);
    return true;
  };

  const forgotPassword = async (email) => {
    setStatus("");
    await cognitoForgotPassword(email);
    return true;
  };

  const confirmForgotPassword = async (email, code, newPassword) => {
    setStatus("");
    await cognitoConfirmForgotPassword(email, code, newPassword);
    return true;
  };

  useInactivityLogout({
    enabled: isAuthenticated,
    onTimeout: () => logout({ redirect: true }),
  });

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      isAuthorized,

      session,
      userGroups,
      allowedGroups,

      status,
      setStatus,

      signIn,
      signUp,
      verify,
      forgotPassword,
      confirmForgotPassword,
      logout,
      refreshFromCognito,
    }),
    [isLoading, isAuthenticated, isAuthorized, session, userGroups, allowedGroups, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
