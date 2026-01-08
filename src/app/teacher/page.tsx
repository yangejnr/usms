export default function TeacherHomePage() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Teacher Dashboard
        </p>
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Review your assigned classes, subjects, and profile details.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "My Subjects",
            description: "View and manage the subjects assigned to you.",
            href: "/teacher/subjects",
          },
          {
            title: "My Classes",
            description: "See the class groups under your care.",
            href: "/teacher/classes",
          },
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-[#0f4c3a]/10 transition hover:translate-y-[-1px]"
          >
            <h2 className="font-display text-2xl">{item.title}</h2>
            <p className="mt-3 text-sm text-[#1b1b18]/70">
              {item.description}
            </p>
          </a>
        ))}
      </section>
    </div>
  );
}
