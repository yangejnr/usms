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

export default function AssignClassPage() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [confirmTeacher, setConfirmTeacher] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("ajs_user");
    if (!raw) {
      return;
    }
    try {
      const user = JSON.parse(raw) as { id?: string | null };
      if (!user?.id) {
        return;
      }
      const fetchTeachers = async () => {
        setListState({ loading: true, error: null });
        try {
          const response = await fetch(
            `/api/school-admin/teachers?user_id=${user.id}`
          );
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
    } catch (error) {
      return;
    }
  }, []);

  const handleDeactivate = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to deactivate teacher.",
        });
        return;
      }
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.id === teacherId
            ? { ...teacher, status: "inactive" }
            : teacher
        )
      );
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Assign Classes
        </p>
        <h1 className="font-display text-3xl">Teachers in your school</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          {schoolName
            ? `School: ${schoolName}`
            : "Manage class assignments for teachers."}
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Teachers
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {teachers.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">ID</th>
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
                    No teachers found for this school.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-t border-[#0f4c3a]/10"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {teacher.account_id ?? teacher.id}
                    </td>
                    <td className="px-6 py-4">
                      {teacher.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4">{teacher.email}</td>
                    <td className="px-6 py-4">
                      {teacher.status === "active" ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formatLabel(teacher.status)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatLabel(teacher.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <a
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          href={`/teacher/assign-class/${teacher.id}`}
                        >
                          View
                        </a>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmTeacher({
                              id: teacher.id,
                              name: teacher.full_name ?? teacher.email,
                            })
                          }
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          confirmTeacher ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmTeacher}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Deactivate {confirmTeacher?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will set the teacher to inactive.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <button
              type="button"
              className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              onClick={() => setConfirmTeacher(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
              onClick={async () => {
                if (!confirmTeacher) {
                  return;
                }
                const id = confirmTeacher.id;
                setConfirmTeacher(null);
                await handleDeactivate(id);
              }}
            >
              Yes, Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
