import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthPage() {
  // NOTE: This page intentionally mirrors the UI from the AI-Dashboard-AWS side project.
  // It assumes AuthContext exposes: signIn, signUp, verify, forgotPassword, confirmForgotPassword, status, setStatus
  const {
    signUp,
    verify,
    signIn,
    forgotPassword,
    confirmForgotPassword,
    status,
    setStatus,
    isAuthenticated,
  } = useAuth();

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const nextPath = useMemo(() => {
    const next = params.get("next");
    return next ? decodeURIComponent(next) : "/";
  }, [params]);

  const [tab, setTab] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [verifyForm, setVerifyForm] = useState({ code: "" });

  const [forgotForm, setForgotForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });

  // If already signed in, go where they intended.
  if (isAuthenticated) {
    // In HashRouter, navigate works fine.
    setTimeout(() => navigate(nextPath), 0);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await signIn(loginForm.email, loginForm.password);
      navigate(nextPath);
    } catch (err) {
      setStatus(err?.message || "Login failed");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await signUp(signupForm.fullName, signupForm.email, signupForm.password);
      setPendingEmail(signupForm.email);
      setTab("verify");
      setStatus("Check your email for the verification code.");
    } catch (err) {
      setStatus(err?.message || "Signup failed");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await verify(pendingEmail, verifyForm.code);
      setStatus("Verified! You can now log in.");
      setTab("login");
    } catch (err) {
      setStatus(err?.message || "Verification failed");
    }
  };

  const handleForgotStart = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await forgotPassword(forgotForm.email);
      setPendingEmail(forgotForm.email);
      setStatus("Check your email for the reset code.");
    } catch (err) {
      setStatus(err?.message || "Failed to start password reset");
    }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await confirmForgotPassword(
        pendingEmail || forgotForm.email,
        forgotForm.code,
        forgotForm.newPassword
      );
      setStatus("Password updated. Please log in.");
      setTab("login");
      setLoginForm((p) => ({ ...p, email: pendingEmail || forgotForm.email, password: "" }));
    } catch (err) {
      setStatus(err?.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f1b34] to-[#0a0f1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="flex flex-col items-center mb-6">
          <a href="/#/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center text-white font-black">
              AI
            </div>
            <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
          </a>
          <div className="mt-2 text-sm text-gray-600 text-center">
            Sign in to access the dashboard.
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setTab("login");
              setStatus("");
            }}
            className={`flex-1 py-2 rounded-xl font-semibold transition ${
              tab === "login" ? "bg-[#1d4ed8] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setStatus("");
            }}
            className={`flex-1 py-2 rounded-xl font-semibold transition ${
              tab === "signup" ? "bg-[#1d4ed8] text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1d4ed8] text-white font-bold hover:opacity-95 transition"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("forgot");
                setStatus("");
                setForgotForm((p) => ({ ...p, email: loginForm.email || p.email }));
                setPendingEmail(loginForm.email || pendingEmail);
              }}
              className="w-full text-sm text-blue-700 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </form>
        )}

        {tab === "signup" && (
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full Name"
              value={signupForm.fullName}
              onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
              required
            />
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="Email"
              value={signupForm.email}
              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              required
            />
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              value={signupForm.password}
              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1d4ed8] text-white font-bold hover:opacity-95 transition"
            >
              Create Account
            </button>
          </form>
        )}

        {tab === "verify" && (
          <form onSubmit={handleVerify} className="space-y-3">
            <div className="text-sm text-gray-700">
              Enter the verification code sent to <span className="font-semibold">{pendingEmail}</span>
            </div>
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Verification Code"
              value={verifyForm.code}
              onChange={(e) => setVerifyForm({ code: e.target.value })}
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1d4ed8] text-white font-bold hover:opacity-95 transition"
            >
              Verify
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <div className="space-y-4">
            <form onSubmit={handleForgotStart} className="space-y-3">
              <div className="text-sm font-semibold text-gray-800">Reset password</div>
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                placeholder="Email"
                value={forgotForm.email}
                onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:opacity-95 transition"
              >
                Send Reset Code
              </button>
            </form>

            <form onSubmit={handleForgotConfirm} className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reset Code"
                value={forgotForm.code}
                onChange={(e) => setForgotForm({ ...forgotForm, code: e.target.value })}
                required
              />
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="password"
                placeholder="New Password"
                value={forgotForm.newPassword}
                onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#1d4ed8] text-white font-bold hover:opacity-95 transition"
              >
                Update Password
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setStatus("");
                }}
                className="w-full text-sm text-gray-700 font-semibold hover:underline"
              >
                Back to login
              </button>
            </form>
          </div>
        )}

        {status && (
          <div className="mt-4 text-center text-sm text-red-600 font-semibold">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
