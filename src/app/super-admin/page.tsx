"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  totalSchools: number;
  activeUsers: number;
  inactiveUsers: number;
};

type SchoolSummary = {
  id: string;
  name: string;
  school_code: string;
  status: string;
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [recentSchools, setRecentSchools] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        const data = await response.json();
        if (!response.ok) {
          setLoading(false);
          return;
        }
        setStats(data?.stats ?? stats);
        setRecentSchools(data?.recentSchools ?? []);
      } catch (error) {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Super Admin Console
        </p>
        <h1 className="font-display text-3xl sm:text-4xl">
          Academic Harmonisation overview.
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Track schools, users, and academic coverage from one unified control
          panel.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Schools",
            value: loading ? "—" : stats.totalSchools.toString(),
            trend: "Registered schools",
            href: "/super-admin/schools",
          },
          {
            title: "Active Users",
            value: loading ? "—" : stats.activeUsers.toString(),
            trend: "Active accounts",
            href: "/super-admin/users",
          },
          {
            title: "Inactive Users",
            value: loading ? "—" : stats.inactiveUsers.toString(),
            trend: "Deactivated accounts",
            href: "/super-admin/users",
          },
          {
            title: "Portal Status",
            value: "Live",
            trend: "Monitoring",
            href: "/super-admin",
          },
        ].map((stat) => (
          <a
            key={stat.title}
            href={stat.href}
            className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-[#0f4c3a]/10"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
              {stat.title}
            </p>
            <p className="mt-4 font-display text-3xl">{stat.value}</p>
            <p className="mt-2 text-sm text-[#1b1b18]/60">{stat.trend}</p>
          </a>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
          <h2 className="font-display text-2xl">This term focus</h2>
          <div className="mt-6 space-y-4 text-sm text-[#1b1b18]/75">
            {[
              "Standardise lesson coverage across all junior classes.",
              "Confirm readiness for WAEC/NECO/JAMB mock schedules.",
              "Reduce score upload delays through offline sync support.",
              "Track fee-default status for accurate result access.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3"
              >
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0f4c3a]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
          <h2 className="font-display text-2xl">Recently added schools</h2>
          <div className="mt-6 space-y-4">
            {recentSchools.length === 0 ? (
              <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-6 text-sm text-[#1b1b18]/70">
                {loading ? "Loading schools..." : "No schools yet."}
              </div>
            ) : (
              recentSchools.map((school) => (
                <div
                  key={school.id}
                  className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm text-[#1b1b18]/80"
                >
                  <div>
                    <p className="font-semibold text-[#1b1b18]">
                      {school.name}
                    </p>
                    <p className="text-xs text-[#1b1b18]/60">
                      {school.school_code}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {school.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
