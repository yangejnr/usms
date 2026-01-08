"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const baseNavItems = [
  { label: "Profile", href: "/teacher/profile" },
  { label: "Subjects", href: "/teacher/subjects" },
  { label: "Classes", href: "/teacher/classes" },
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
    const raw = localStorage.getItem("ajs_user");
    if (!raw) {
      return;
    }
    try {
      const user = JSON.parse(raw) as {
        full_name?: string | null;
        email?: string | null;
        account_id?: string | null;
        id?: string | null;
      };
      setDisplayName(
        user.full_name || user.account_id || user.email || "Teacher"
      );
      if (user.id) {
        const checkSchoolAdmin = async () => {
          try {
            const response = await fetch(
              `/api/admin/school-admins/${user.id}`
            );
            const data = await response.json();
            if (response.ok && data?.assigned) {
              setShowAssign(true);
            }
          } catch (error) {
            setShowAssign(false);
          }
        };
        checkSchoolAdmin();
      }
    } catch (error) {
      setDisplayName("Teacher");
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

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
          <nav className="space-y-2 text-sm font-medium text-[#1b1b18]/80">
            {[
              ...baseNavItems,
              ...(showAssign
                ? [
                    { label: "Students", href: "/teacher/students" },
                    { label: "Teacher Class", href: "/teacher/assign-class" },
                    { label: "Student Class", href: "/teacher/student-class" },
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#1b1b18]/70 md:flex-row md:items-center md:justify-between">
          <span>Archdiocese of Jos Academic Harmonisation Portal</span>
          <span>Teacher workspace</span>
        </div>
      </footer>
    </div>
  );
}
