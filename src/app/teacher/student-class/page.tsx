"use client";

import { useEffect, useState } from "react";

type StudentItem = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
  gender: string;
  status?: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function StudentClassPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [confirmStudent, setConfirmStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setListState({ loading: true, error: null });
      try {
        const response = await fetch(`/api/school-admin/students`);
        const data = await response.json();
        if (!response.ok) {
          setListState({
            loading: false,
            error: data?.message ?? "Unable to fetch students.",
          });
          return;
        }
        setStudents(data?.students ?? []);
        setSchoolName(data?.school ?? null);
        setListState({ loading: false, error: null });
      } catch (error) {
        setListState({
          loading: false,
          error: "Unable to reach the server.",
        });
      }
    };
    fetchStudents();
  }, []);

  const handleDeactivate = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/school-admin/students/${studentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "inactive" }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to deactivate student.",
        });
        return;
      }
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, status: "inactive" } : student
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
          Student Class
        </p>
        <h1 className="font-display text-3xl">
          {schoolName
            ? `Students in ${schoolName.toUpperCase()}`
            : "Students in your school"}
        </h1>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Students
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {students.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Student No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {listState.error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No students found for this school.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-[#0f4c3a]/10"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {student.student_no}
                    </td>
                    <td className="px-6 py-4">
                      {student.surname} {student.firstname}{" "}
                      {student.othername ?? ""}
                    </td>
                    <td className="px-6 py-4">
                      {formatLabel(student.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <a
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          href={`/teacher/student-class/${student.id}`}
                        >
                          View
                        </a>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmStudent({
                              id: student.id,
                              name: `${student.surname} ${student.firstname}`,
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
          confirmStudent ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmStudent}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Deactivate {confirmStudent?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will set the student to inactive.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <button
              type="button"
              className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              onClick={() => setConfirmStudent(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
              onClick={async () => {
                if (!confirmStudent) {
                  return;
                }
                const id = confirmStudent.id;
                setConfirmStudent(null);
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
