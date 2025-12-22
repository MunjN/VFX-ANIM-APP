// src/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function AwaitingAccess({ allowedGroups, userGroups }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1b34] to-[#0a0f1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="flex flex-col items-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center text-white font-black">
            AI
          </div>
          <div className="mt-3 text-xl font-bold tracking-wide">Access required</div>
          <div className="mt-2 text-sm text-gray-700 text-center">
            You’re signed in, but your account isn’t allowed to access this dashboard yet.
          </div>
        </div>

        {Array.isArray(allowedGroups) && allowedGroups.length > 0 && (
          <div className="mt-4 text-sm text-gray-800">
            <div className="font-semibold">Allowed group(s):</div>
            <div className="mt-1 text-gray-700">{allowedGroups.join(", ")}</div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-800">
          <div className="font-semibold">Your group(s):</div>
          <div className="mt-1 text-gray-700">
            {Array.isArray(userGroups) && userGroups.length > 0 ? userGroups.join(", ") : "None"}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <a
            href="/#/"
            className="flex-1 text-center py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:opacity-95 transition"
          >
            Refresh
          </a>
          <a
            href="/#/auth"
            className="flex-1 text-center py-3 rounded-xl bg-[#1d4ed8] text-white font-bold hover:opacity-95 transition"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { isLoading, isAuthenticated, isAuthorized, allowedGroups, userGroups } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 600 }}>Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!isAuthorized) {
    return <AwaitingAccess allowedGroups={allowedGroups} userGroups={userGroups} />;
  }

  return children;
}
