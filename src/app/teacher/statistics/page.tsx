"use client";

import { useEffect, useMemo, useState } from "react";

type StatRow = {
  id: string;
  name: string;
  code: string;
  category: string;
  total: number;
};

type GenderRow = {
  gender: string;
  total: number;
};

const barPalette = [
  "#f8b4c8",
  "#f6c59a",
  "#f7ddae",
  "#bfe7e5",
  "#b9d7f6",
  "#c8b8f9",
  "#d7d7d7",
];

function VerticalBarChart({
  rows,
  maxValue,
  unitLabel,
}: {
  rows: StatRow[];
  maxValue: number;
  unitLabel: string;
}) {
  return (
    <div className="mt-6">
      <div className="relative h-64 w-full rounded-3xl border border-[#0f4c3a]/10 bg-white px-4 pb-8 pt-6">
        <div className="absolute left-4 right-4 top-6 flex h-40 items-end justify-between gap-4">
          {rows.map((row, index) => {
            const height = Math.max(
              6,
              Math.round((row.total / maxValue) * 100)
            );
            return (
              <div key={row.id} className="flex h-full flex-1 items-end">
                <div className="w-full">
                  <div className="mb-2 text-center text-xs font-semibold text-[#0f4c3a]/80">
                    {row.total}
                  </div>
                  <div
                    className="mx-auto w-full rounded-2xl border border-[#0f4c3a]/20"
                    style={{
                      height: `${height}%`,
                      background: barPalette[index % barPalette.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex-1 text-center text-xs text-[#1b1b18]/70"
            >
              {row.name}
            </div>
          ))}
        </div>
        <div className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.3em] text-[#0f4c3a]/60">
          {unitLabel}
        </div>
      </div>
    </div>
  );
}

export default function TeacherStatisticsPage() {
  const [studentsByClass, setStudentsByClass] = useState<StatRow[]>([]);
  const [teachersByClass, setTeachersByClass] = useState<StatRow[]>([]);
  const [genderDistribution, setGenderDistribution] = useState<GenderRow[]>(
    []
  );
  const [school, setSchool] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(`/api/school-admin/statistics`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Unable to load statistics.");
        }
        setStudentsByClass(data?.studentsByClass ?? []);
        setTeachersByClass(data?.teachersByClass ?? []);
        setGenderDistribution(data?.genderDistribution ?? []);
        setSchool(data?.school ?? "");
        setError(null);
      } catch (fetchError) {
        setError("Unable to load statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const maxStudentCount = useMemo(() => {
    return Math.max(1, ...studentsByClass.map((row) => row.total || 0));
  }, [studentsByClass]);

  const maxTeacherCount = useMemo(() => {
    return Math.max(1, ...teachersByClass.map((row) => row.total || 0));
  }, [teachersByClass]);

  const totalGenderCount = useMemo(() => {
    return genderDistribution.reduce((sum, row) => sum + (row.total || 0), 0);
  }, [genderDistribution]);

  const genderSlices = useMemo(() => {
    if (!genderDistribution.length || totalGenderCount === 0) {
      return [];
    }

    const palette = ["#0f4c3a", "#e07a5f", "#3d405b", "#f2cc8f", "#81b29a"];
    let cumulative = 0;

    return genderDistribution.map((row, index) => {
      const value = row.total || 0;
      const start = cumulative;
      const angle = (value / totalGenderCount) * 360;
      cumulative += angle;
      return {
        label: row.gender,
        value,
        color: palette[index % palette.length],
        start,
        end: cumulative,
      };
    });
  }, [genderDistribution, totalGenderCount]);

  const genderConic = useMemo(() => {
    if (!genderSlices.length) {
      return "conic-gradient(#e5e7eb 0deg 360deg)";
    }
    const segments = genderSlices
      .map((slice) => `${slice.color} ${slice.start}deg ${slice.end}deg`)
      .join(", ");
    return `conic-gradient(${segments})`;
  }, [genderSlices]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-sm text-[#1b1b18]/70">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-2xl shadow-red-200/40">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
          Statistics
        </p>
        <h1 className="font-display text-3xl">
          {school ? `School Overview · ${school}` : "School Overview"}
        </h1>
        <p className="text-sm text-[#1b1b18]/70">
          Students and teachers distribution across classes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
                Students by Class
              </p>
              <h2 className="font-display text-2xl">Class Enrolment</h2>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Students</th>
                </tr>
              </thead>
              <tbody>
                {studentsByClass.map((row) => (
                  <tr key={row.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-4 py-3 font-semibold text-[#1b1b18]">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f4c3a]">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <VerticalBarChart
            rows={studentsByClass}
            maxValue={maxStudentCount}
            unitLabel="Students"
          />
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
                Teachers by Class
              </p>
              <h2 className="font-display text-2xl">Teaching Coverage</h2>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                <tr>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Teachers</th>
                </tr>
              </thead>
              <tbody>
                {teachersByClass.map((row) => (
                  <tr key={row.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-4 py-3 font-semibold text-[#1b1b18]">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0f4c3a]">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <VerticalBarChart
            rows={teachersByClass}
            maxValue={maxTeacherCount}
            unitLabel="Teachers"
          />
        </section>
      </div>

      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#0f4c3a]/70">
            Student Distribution by Gender
          </p>
          <h2 className="font-display text-2xl">Gender Split</h2>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex items-center justify-center">
            <div
              className="h-48 w-48 rounded-full border border-[#0f4c3a]/10"
              style={{ background: genderConic }}
            />
          </div>
          <div className="space-y-3">
            {genderSlices.map((slice) => (
              <div
                key={slice.label}
                className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="capitalize text-[#1b1b18]/80">
                    {slice.label}
                  </span>
                </div>
                <span className="font-semibold text-[#0f4c3a]">
                  {slice.value}
                </span>
              </div>
            ))}
            {!genderSlices.length ? (
              <p className="text-sm text-[#1b1b18]/60">
                No student records yet.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
