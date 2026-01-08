"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function validate(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  const rules = validate(password);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ loading: true, error: null, success: null });

    if (!token) {
      setState({
        loading: false,
        error: "Reset token is missing.",
        success: null,
      });
      return;
    }

    if (password !== confirm) {
      setState({
        loading: false,
        error: "Passwords do not match.",
        success: null,
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to reset password.",
          success: null,
        });
        return;
      }

      setState({
        loading: false,
        error: null,
        success: "Password updated. You can now sign in.",
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
          Reset Password
        </p>
        <h1 className="font-display text-3xl">Create a new password</h1>
        <p className="mt-2 text-sm text-[#1b1b18]/70">
          Your new password must meet the security requirements.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
            />
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
