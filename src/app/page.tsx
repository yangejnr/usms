"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  const submitSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthError(data?.message ?? "Invalid credentials.");
        return;
      }

      if (data?.user) {
        localStorage.setItem("ajs_user", JSON.stringify(data.user));
      }
      setAuthSuccess("Signed in successfully.");
      setSignInOpen(false);
      router.push("/super-admin");
    } catch (error) {
      setAuthError("Unable to reach the server.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1b1b18]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#c49a3b]/20 blur-3xl" />
          <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-[#0f4c3a]/20 blur-3xl" />
          <div className="absolute left-1/3 top-[60%] h-64 w-64 rounded-full bg-[#d9c7aa]/40 blur-3xl" />
        </div>

        <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0f4c3a]/40 bg-white/80">
              <span className="font-display text-xl text-[#0f4c3a]">AJ</span>
            </div>
            <div>
              <p className="font-display text-lg leading-none">
                Archdiocese of Jos
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
                Academic Harmonisation
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#1b1b18]/80 lg:flex">
            <a href="#vision" className="transition hover:text-[#0f4c3a]">
              Vision
            </a>
            <a href="#workflow" className="transition hover:text-[#0f4c3a]">
              Workflow
            </a>
            <a href="#governance" className="transition hover:text-[#0f4c3a]">
              Governance
            </a>
            <a href="#schools" className="transition hover:text-[#0f4c3a]">
              Schools
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              className="hidden rounded-full border border-[#1b1b18]/20 px-4 py-2 text-sm font-medium text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a] md:inline-flex"
              onClick={() => setSignInOpen(true)}
            >
              Sign In
            </button>
            <button className="rounded-full bg-[#0f4c3a] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#0f4c3a]/25 transition hover:translate-y-[-1px] hover:bg-[#0c3c2f]">
              Request Access
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white/80 text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a] lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span className="text-lg">☰</span>
            </button>
          </div>
        </header>

        <main className="relative">
          <section
            id="vision"
            className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
          >
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0f4c3a]">
                Academic Harmonisation Portal
              </p>
              <h1 className="font-display text-4xl leading-tight text-[#1b1b18] sm:text-5xl lg:text-6xl">
                A single diocesan standard for every Catholic secondary school in
                Jos.
              </h1>
              <p className="text-lg text-[#1b1b18]/75">
                Coordinate schemes of work, harmonise assessments, and deliver
                consistent academic standards across schools. Built for
                intermittent connectivity, printable outputs, and real-world
                classroom rhythms.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="rounded-full bg-[#0f4c3a] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/30 transition hover:translate-y-[-1px]">
                  Launch diocesan pilot
                </button>
                <button className="rounded-full border border-[#1b1b18]/20 bg-white/70 px-6 py-3 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]">
                  View portal plan
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[#1b1b18]/70">
                <div>
                  <p className="font-semibold text-[#1b1b18]">
                    Multi-tenant by school
                  </p>
                  <p>Strict data isolation with diocesan oversight.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1b1b18]">
                    Not a CBT platform
                  </p>
                  <p>Teachers download, print, and administer offline.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
                    Portal Snapshot
                  </p>
                  <span className="rounded-full bg-[#d9c7aa]/70 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
                    2024/2025
                  </span>
                </div>
                <h2 className="font-display text-2xl">
                  Harmonised standards, measurable outcomes.
                </h2>
                <p className="text-sm text-[#1b1b18]/70">
                  Align teaching plans, assessments, and reporting so every
                  school is ready for WAEC, NECO, and JAMB.
                </p>
                <div className="grid gap-3">
                  {[
                    "Syllabus coverage tracking for WAEC/NECO/JAMB readiness",
                    "Lesson guides aligned to diocesan scheme of work",
                    "Fair, consistent assessment schedules across schools",
                    "Secure, reliable academic records and analytics",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm text-[#1b1b18]/80"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#0f4c3a]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-6xl px-6 pb-20">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Central Question Bank",
                  copy: "Curated by subject, topic, and term to support consistent assessment design.",
                },
                {
                  title: "Harmonised Lesson Guidance",
                  copy: "Lesson plans aligned to diocesan schemes and required syllabus coverage.",
                },
                {
                  title: "Offline Administration",
                  copy: "Downloadable papers and score sheets for schools with unstable connectivity.",
                },
                {
                  title: "Analytics & Readiness",
                  copy: "Subject mastery dashboards and remediation insights for school heads.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-[#0f4c3a]/10"
                >
                  <h3 className="font-display text-xl">{card.title}</h3>
                  <p className="mt-3 text-sm text-[#1b1b18]/70">{card.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="workflow"
            className="mx-auto w-full max-w-6xl px-6 pb-20"
          >
            <div className="grid gap-8 lg:grid-cols-[0.6fr_1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0f4c3a]">
                  Harmonised Workflow
                </p>
                  <h2 className="font-display text-3xl sm:text-4xl">
                    Clear objectives across every term.
                  </h2>
                  <p className="mt-4 text-sm text-[#1b1b18]/70">
                  The portal focuses on standardising teaching, coverage, and
                  reporting to improve readiness across all schools.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Align schemes of work to term calendars.",
                    "Track syllabus coverage and lesson completion.",
                    "Standardise assessment schedules across schools.",
                    "Enable offline administration and later score upload.",
                    "Publish results with fee-default restrictions enforced.",
                    "Aggregate diocesan analytics for continuous improvement.",
                  ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-4 rounded-2xl border border-[#0f4c3a]/15 bg-white/70 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f4c3a] text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm text-[#1b1b18]/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="governance"
            className="mx-auto w-full max-w-6xl px-6 pb-20"
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
                <h3 className="font-display text-2xl">
                  Governance that protects standards and accountability.
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-[#1b1b18]/75">
                  <li>
                    Role-based access from diocesan admin to school teacher.
                  </li>
                  <li>Every action logged with user, device, and timestamp.</li>
                  <li>Controlled access ensures students never see papers.</li>
                  <li>Fee-default students are blocked from result views.</li>
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0f4c3a]">
                  Data Isolation
                </p>
                <h2 className="font-display text-3xl sm:text-4xl">
                  Unified visibility with clear institutional boundaries.
                </h2>
                <p className="text-sm text-[#1b1b18]/70">
                  Each school owns its records, results, and student data. The
                  Archdiocese aggregates diocesan analytics without breaking
                  isolation.
                </p>
                <div className="rounded-2xl border border-[#0f4c3a]/15 bg-[#0f4c3a] p-5 text-sm text-white">
                  <p className="font-semibold">
                    Compliance-focused by design.
                  </p>
                  <p className="mt-2 text-white/80">
                    All data changes are traceable, reversible, and exportable
                    for inspections or accreditation reviews.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="schools"
            className="mx-auto w-full max-w-6xl px-6 pb-24"
          >
            <div className="rounded-3xl border border-white/70 bg-white/80 p-10 shadow-2xl shadow-[#0f4c3a]/10">
              <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0f4c3a]">
                    Ready for Every Term
                  </p>
                  <h2 className="font-display text-3xl sm:text-4xl">
                    Built for Nigerian diocesan realities.
                  </h2>
                  <p className="mt-4 text-sm text-[#1b1b18]/70">
                    Lightweight UX, printable packs, offline score entry, and
                    clear approvals keep schools moving even when the internet
                    does not.
                  </p>
                </div>
                <div className="space-y-3 text-sm text-[#1b1b18]/75">
                  <div className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3">
                    <span>Term & session management</span>
                    <span className="font-semibold text-[#0f4c3a]">Active</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3">
                    <span>Class & subject combinations</span>
                    <span className="font-semibold text-[#0f4c3a]">Covered</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3">
                    <span>Printable assessment packs</span>
                    <span className="font-semibold text-[#0f4c3a]">Ready</span>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#0f4c3a]/10 pt-6 text-sm text-[#1b1b18]/70">
                <p>
                  Students never see papers. Teachers see only during approved
                  windows.
                </p>
                <button className="rounded-full bg-[#1b1b18] px-5 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px]">
                  Schedule a diocesan demo
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="border-t border-[#0f4c3a]/10 bg-[#f1eadc]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg">Academic Harmonisation Portal</p>
            <p className="text-sm text-[#1b1b18]/70">
              Archdiocese of Jos Catholic Schools
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#1b1b18]/70">
            <span>Governed assessments</span>
            <span>•</span>
            <span>Diocesan analytics</span>
            <span>•</span>
            <span>Offline-ready administration</span>
          </div>
        </div>
      </footer>

        <div
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!mobileOpen}
          onClick={() => setMobileOpen(false)}
        />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-xs transform bg-[#f7f2e8] shadow-2xl transition-transform ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
          <div>
            <p className="font-display text-lg">Archdiocese of Jos</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
              Menu
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <span className="text-lg">×</span>
          </button>
        </div>
        <nav className="flex flex-col gap-4 px-6 py-6 text-sm font-medium text-[#1b1b18]/80">
          {[
            { label: "Vision", href: "#vision" },
            { label: "Workflow", href: "#workflow" },
            { label: "Governance", href: "#governance" },
            { label: "Schools", href: "#schools" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl border border-transparent px-3 py-2 transition hover:border-[#0f4c3a]/20 hover:bg-white"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-[#0f4c3a]/10 px-6 py-6">
          <button
            className="w-full rounded-full border border-[#1b1b18]/20 px-4 py-3 text-sm font-medium text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
            onClick={() => {
              setMobileOpen(false);
              setSignInOpen(true);
            }}
          >
            Sign In
          </button>
          <button className="w-full rounded-full bg-[#0f4c3a] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-[#0f4c3a]/25 transition hover:translate-y-[-1px]">
            Request Access
          </button>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          signInOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!signInOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setSignInOpen(false)}
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Sign In</p>
              <p className="text-sm text-[#1b1b18]/70">
                Access the academic harmonisation portal.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close sign in"
              onClick={() => setSignInOpen(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-5 px-6 py-6" onSubmit={submitSignIn}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Email or staff ID
              </label>
              <input
                type="text"
                placeholder="you@school.edu.ng"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 pr-12 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/70 transition hover:text-[#0f4c3a]"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#1b1b18]/70">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded" />
                Remember this device
              </label>
              <button type="button" className="text-[#0f4c3a]">
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[#0f4c3a] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/25 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={authLoading}
            >
              {authLoading ? "Signing In..." : "Sign In"}
            </button>
            {authError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {authError}
              </p>
            ) : null}
            {authSuccess ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                {authSuccess}
              </p>
            ) : null}
            <p className="text-center text-xs text-[#1b1b18]/60">
              Need access? Contact your diocesan administrator.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
