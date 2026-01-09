"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const baseNavItems = [
  { label: "Profile", href: "/teacher/profile" },
  { label: "Subjects", href: "/teacher/subjects" },
  { label: "Classes", href: "/teacher/classes" },
  { label: "Form Teacher", href: "/teacher/form-classes" },
];

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [displayName, setDisplayName] = useState("Teacher");
  const [accountOpen, setAccountOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (!response.ok || !data?.user) {
          return;
        }
        const user = data.user as {
          full_name?: string | null;
          email?: string | null;
          account_id?: string | null;
          id?: string | null;
          user_role?: string | null;
        };
        setDisplayName(
          user.full_name || user.account_id || user.email || "Teacher"
        );
        if (user.user_role === "admin") {
          setShowAssign(true);
          return;
        }
        if (user.id) {
          const adminResponse = await fetch(
            `/api/admin/school-admins/${user.id}`
          );
          const adminData = await adminResponse.json();
          if (adminResponse.ok && adminData?.assigned) {
            setShowAssign(true);
          }
        }
      } catch (error) {
        setDisplayName("Teacher");
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        router.push("/");
      }
    };
    doLogout();
  };

  return (
    <div className="min-h-screen bg-[#f7f2e8] text-[#1b1b18] overflow-x-hidden">
      <div className="flex w-full max-w-none items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
            Teacher Portal
          </p>
          <p className="font-display text-lg">{displayName}</p>
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
            onClick={() => setAccountOpen((prev) => !prev)}
          >
            <span className="text-base">⚙</span>
            <span>Account ▾</span>
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 rounded-2xl border border-[#0f4c3a]/10 bg-white/95 p-2 shadow-xl transition ${
              accountOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <button
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[#1b1b18] transition hover:bg-[#f1eadc]"
              onClick={() => {
                setAccountOpen(false);
                router.push("/change-password");
              }}
            >
              Change password
              <span className="text-[#0f4c3a]/60">›</span>
            </button>
            <button
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-[#1b1b18] transition hover:bg-[#f1eadc]"
              onClick={handleLogout}
            >
              Logout
              <span className="text-[#0f4c3a]/60">›</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-none gap-6 px-6 pb-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
          <nav className="space-y-2 text-sm font-medium text-[#1b1b18]/80">
            {[
              ...baseNavItems,
              ...(showAssign
                ? [
                    { label: "Students", href: "/teacher/students" },
                    { label: "Teacher Class", href: "/teacher/assign-class" },
                    { label: "Student Class", href: "/teacher/student-class" },
                    { label: "Assign Form Teacher", href: "/teacher/form-teacher" },
                    { label: "Statistics", href: "/teacher/statistics" },
                  ]
                : []),
            ].map((item) => (
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
        </aside>
        <main className="min-h-[80vh]">{children}</main>
      </div>
      <footer className="border-t border-[#0f4c3a]/10 bg-[#f1eadc]">
        <div className="flex w-full max-w-none flex-col gap-4 px-6 py-6 text-sm text-[#1b1b18]/70 md:flex-row md:items-center md:justify-between">
          <span>Archdiocese of Jos Academic Harmonisation Portal</span>
          <span>Teacher workspace</span>
        </div>
      </footer>
    </div>
  );
}
