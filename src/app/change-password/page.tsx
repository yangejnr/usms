"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  email?: string | null;
  account_id?: string | null;
  full_name?: string | null;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  useEffect(() => {
    const raw = localStorage.getItem("ajs_user");
    if (!raw) {
      return;
    }
    try {
      const user = JSON.parse(raw) as StoredUser;
      setIdentifier(user.account_id || user.email || "");
    } catch (error) {
      setIdentifier("");
    }
  }, []);

  const rules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ loading: true, error: null, success: null });

    if (!identifier) {
      setState({
        loading: false,
        error: "No user context found. Please sign in again.",
        success: null,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setState({
        loading: false,
        error: "New passwords do not match.",
        success: null,
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to update password.",
          success: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        success: "Password updated. Redirecting...",
      });
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] px-6 py-16 text-[#1b1b18]">
      <div className="mx-auto w-full max-w-lg rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Change Password
        </p>
        <h1 className="font-display text-3xl">Update your password</h1>
        <p className="mt-2 text-sm text-[#1b1b18]/70">
          Use your temporary password once, then set a secure replacement.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 pr-12 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/70 transition hover:text-[#0f4c3a]"
                onClick={() => setShowCurrent((prev) => !prev)}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 pr-12 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/70 transition hover:text-[#0f4c3a]"
                onClick={() => setShowNew((prev) => !prev)}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 pr-12 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/70 transition hover:text-[#0f4c3a]"
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] px-4 py-3 text-xs text-[#1b1b18]/70">
            <p className="font-semibold text-[#1b1b18]">Password policy</p>
            <ul className="mt-2 space-y-1">
              <li>{rules.minLength ? "✓" : "•"} Minimum 8 characters</li>
              <li>{rules.hasUpper ? "✓" : "•"} One uppercase letter</li>
              <li>{rules.hasLower ? "✓" : "•"} One lowercase letter</li>
              <li>{rules.hasNumber ? "✓" : "•"} One number</li>
              <li>{rules.hasSpecial ? "✓" : "•"} One special character</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[#0f4c3a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/25 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={state.loading}
          >
            {state.loading ? "Updating..." : "Update Password"}
          </button>

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
              {state.success}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
