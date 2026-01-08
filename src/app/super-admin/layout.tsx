"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/super-admin" },
  { label: "Users", href: "/super-admin/users" },
  { label: "Schools", href: "/super-admin/schools" },
  { label: "Approvals", href: "/super-admin/approvals" },
  { label: "Reports", href: "/super-admin/reports" },
];

export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [displayName, setDisplayName] = useState("Super Admin");
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("ajs_user");
    if (!raw) {
      return;
    }
    try {
      const user = JSON.parse(raw) as {
        full_name?: string | null;
        email?: string | null;
        username?: string | null;
        account_id?: string | null;
      };
      setDisplayName(
        user.full_name || user.account_id || user.email || user.username || "Super Admin"
      );
    } catch (error) {
      setDisplayName("Super Admin");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ajs_user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1b1b18]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
            Logged in
          </p>
          <p className="font-display text-lg">{displayName}</p>
        </div>
        <button
          className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#0f4c3a]/40 bg-white/80">
              <span className="font-display text-xl text-[#0f4c3a]">AJ</span>
            </div>
            <div>
              <p className="font-display text-lg leading-none">Super Admin</p>
              <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
                Console
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm font-medium text-[#1b1b18]/80">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition hover:border-[#0f4c3a]/20 hover:bg-white"
              >
                <span>{item.label}</span>
                <span className="text-[#0f4c3a]/60">›</span>
              </a>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-4 text-xs text-[#1b1b18]/70">
            Signed in as {displayName}
          </div>
        </aside>

        <main className="min-h-[80vh]">{children}</main>
      </div>
      <footer className="border-t border-[#0f4c3a]/10 bg-[#f1eadc]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#1b1b18]/70 md:flex-row md:items-center md:justify-between">
          <span>Archdiocese of Jos Academic Harmonisation Portal</span>
          <span>Governed access • Offline-ready • Diocesan oversight</span>
        </div>
      </footer>
    </div>
  );
}
