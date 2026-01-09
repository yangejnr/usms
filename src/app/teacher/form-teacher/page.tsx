"use client";

import { useEffect, useState } from "react";

type TeacherItem = {
  id: string;
  account_id: string | null;
  full_name: string | null;
  email: string;
  status: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function FormTeacherPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  useEffect(() => {
    const fetchTeachers = async () => {
      setListState({ loading: true, error: null });
      try {
        const response = await fetch(`/api/school-admin/teachers`);
        const data = await response.json();
        if (!response.ok) {
          setListState({
            loading: false,
            error: data?.message ?? "Unable to fetch teachers.",
          });
          return;
        }
        setTeachers(data?.teachers ?? []);
        setSchoolName(data?.school ?? null);
        setListState({ loading: false, error: null });
      } catch (error) {
        setListState({
          loading: false,
          error: "Unable to reach the server.",
        });
      }
    };
    fetchTeachers();
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Form Teacher
        </p>
        <h1 className="font-display text-3xl">Assign form teacher roles</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          {schoolName
            ? `School: ${schoolName}`
            : "Assign classes to form teachers in your school."}
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">Teachers</p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {teachers.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading teachers...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {listState.error}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No teachers found.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-6 py-4 text-sm text-[#1b1b18]/70">
                      {teacher.account_id ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {teacher.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatLabel(teacher.status)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/teacher/form-teacher/${teacher.id}`}
                        className="rounded-full border border-[#0f4c3a]/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a] transition hover:border-[#0f4c3a] hover:bg-[#0f4c3a] hover:text-white"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
