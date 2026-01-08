export default function SuperAdminDashboard() {
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
          { title: "Total Schools", value: "24", trend: "+2 this term" },
          { title: "Active Users", value: "312", trend: "92% active" },
          { title: "Pending Approvals", value: "18", trend: "Needs review" },
          { title: "Assessment Packs", value: "64", trend: "Current session" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-[#0f4c3a]/10"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
              {stat.title}
            </p>
            <p className="mt-4 font-display text-3xl">{stat.value}</p>
            <p className="mt-2 text-sm text-[#1b1b18]/60">{stat.trend}</p>
          </div>
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
          <h2 className="font-display text-2xl">Quick Actions</h2>
          <div className="mt-6 space-y-4">
            {[
              "Add new school administrator",
              "Create diocesan admin role",
              "Review pending access requests",
              "Download audit activity report",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm text-[#1b1b18]/80"
              >
                <span>{item}</span>
                <button className="text-sm font-semibold text-[#0f4c3a]">
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
