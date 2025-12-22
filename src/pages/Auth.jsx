import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthPage() {
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
  const [signupForm, setSignupForm] = useState({ fullName: "", email: "", password: "" });
  const [verifyForm, setVerifyForm] = useState({ code: "" });
  const [forgotForm, setForgotForm] = useState({ email: "", code: "", newPassword: "" });

  if (isAuthenticated) {
    setTimeout(() => navigate(nextPath), 0);
  }

  const onLogin = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await signIn(loginForm.email, loginForm.password);
      navigate(nextPath);
    } catch (err) {
      setStatus(err?.message || "Login failed");
    }
  };

  const onSignup = async (e) => {
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

  const onVerify = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await verify(pendingEmail, verifyForm.code);
      setStatus("Verified! You can now sign in.");
      setTab("login");
    } catch (err) {
      setStatus(err?.message || "Verification failed");
    }
  };

  const onForgotStart = async (e) => {
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

  const onForgotConfirm = async (e) => {
    e.preventDefault();
    setStatus("");
    try {
      await confirmForgotPassword(
        pendingEmail || forgotForm.email,
        forgotForm.code,
        forgotForm.newPassword
      );
      setStatus("Password updated. Please sign in.");
      setTab("login");
      setLoginForm((p) => ({ ...p, email: pendingEmail || forgotForm.email, password: "" }));
    } catch (err) {
      setStatus(err?.message || "Failed to reset password");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ backgroundColor: "#1d186d" }}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-4 text-white">
        <a href="https://me-dmz.com" target="_blank" rel="noreferrer">
          <div className="text-xl font-bold tracking-wide">ME-DMZ</div>
        </a>
        <div className="text-sm opacity-80">ME-NEXUS VFX-Animation Web App</div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl mt-10"
        style={{ color: "#1d186d" }}
      >
        <div className="flex gap-3 mb-6">
          <button
            className={`${tab === "login" ? "text-white" : "bg-gray-100"} flex-1 py-2 rounded-md font-semibold`}
            style={{ backgroundColor: tab === "login" ? "#1d186d" : undefined }}
            onClick={() => {
              setTab("login");
              setStatus("");
            }}
          >
            Sign In
          </button>

          <button
            className={`${tab === "signup" ? "text-white" : "bg-gray-100"} flex-1 py-2 rounded-md font-semibold`}
            style={{ backgroundColor: tab === "signup" ? "#1d186d" : undefined }}
            onClick={() => {
              setTab("signup");
              setStatus("");
            }}
          >
            Create Account
          </button>
        </div>

        {tab === "login" && (
          <form onSubmit={onLogin} className="space-y-3">
            <h2 className="text-2xl font-bold mb-2 text-center">Sign In</h2>

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-95"
              style={{ backgroundColor: "#1d186d" }}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("forgot");
                setStatus("");
                setForgotForm((p) => ({ ...p, email: loginForm.email || p.email }));
                setPendingEmail(loginForm.email || pendingEmail);
              }}
              className="w-full text-sm font-semibold hover:underline"
              style={{ color: "#1d186d" }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {tab === "signup" && (
          <form onSubmit={onSignup} className="space-y-3">
            <h2 className="text-2xl font-bold mb-2 text-center">Create Account</h2>

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              placeholder="Full Name"
              value={signupForm.fullName}
              onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
              required
            />

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              type="email"
              placeholder="Email"
              value={signupForm.email}
              onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
              required
            />

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              type="password"
              placeholder="Password"
              value={signupForm.password}
              onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-95"
              style={{ backgroundColor: "#1d186d" }}
            >
              Create Account
            </button>
          </form>
        )}

        {tab === "verify" && (
          <form onSubmit={onVerify} className="space-y-3">
            <h2 className="text-2xl font-bold mb-2 text-center">Verify Email</h2>
            <div className="text-sm text-gray-600 text-center">
              Enter the verification code sent to{" "}
              <span className="font-semibold">{pendingEmail}</span>
            </div>

            <input
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#1d186d" }}
              placeholder="Verification Code"
              value={verifyForm.code}
              onChange={(e) => setVerifyForm({ code: e.target.value })}
              required
            />

            <button
              type="submit"
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-95"
              style={{ backgroundColor: "#1d186d" }}
            >
              Verify
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <div className="space-y-4">
            <form onSubmit={onForgotStart} className="space-y-3">
              <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>

              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#1d186d" }}
                type="email"
                placeholder="Email"
                value={forgotForm.email}
                onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                required
              />

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:opacity-95"
              >
                Send Reset Code
              </button>
            </form>

            <form onSubmit={onForgotConfirm} className="space-y-3">
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#1d186d" }}
                placeholder="Reset Code"
                value={forgotForm.code}
                onChange={(e) => setForgotForm({ ...forgotForm, code: e.target.value })}
                required
              />

              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2"
                style={{ "--tw-ring-color": "#1d186d" }}
                type="password"
                placeholder="New Password"
                value={forgotForm.newPassword}
                onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                required
              />

              <button
                type="submit"
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-95"
                style={{ backgroundColor: "#1d186d" }}
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
                Back to sign in
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
