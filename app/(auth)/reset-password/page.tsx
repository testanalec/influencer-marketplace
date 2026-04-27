"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setMessage("Invalid or missing reset token.");
      return;
    }

    // Verify token validity
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setMessage(data.error || "This reset link is invalid or has expired.");
        }
      })
      .catch(() => {
        setTokenValid(false);
        setMessage("Failed to verify reset link.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Password reset successfully!");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to reset password.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (tokenValid === null) {
    return (
      <div className="text-center py-8 text-gray-500">Verifying reset link...</div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-700 font-medium mb-2">{message}</p>
        <p className="text-gray-500 text-sm mb-6">Please request a new password reset link.</p>
        <Link href="/forgot-password" className="btn-primary inline-block">
          Request New Link
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === "success" ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-medium mb-2">Password reset successfully!</p>
          <p className="text-gray-500 text-sm">Redirecting you to login...</p>
        </div>
      ) : (
        <>
          {status === "error" && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-field"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Re-enter password"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full btn-primary disabled:opacity-50"
            >
              {status === "loading" ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 gradient-text">
            Set New Password
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Choose a strong new password for your account
          </p>
          <Suspense fallback={<div className="text-center py-8 text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
