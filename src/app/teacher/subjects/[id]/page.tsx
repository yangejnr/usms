"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ClassItem = {
  id: string;
  name: string;
  code: string;
  category: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function TeacherSubjectDetailPage() {
  const params = useParams();
  const subjectId = String(params.id ?? "");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<
    { id: string; student_no: string; surname: string; firstname: string; othername: string | null }[]
  >([]);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  useEffect(() => {
    const raw = localStorage.getItem("ajs_user");
    if (!raw || !subjectId) {
      return;
    }
    try {
      const user = JSON.parse(raw) as { id?: string | null };
      if (!user?.id) {
        return;
      }
      const fetchClasses = async () => {
        setListState({ loading: true, error: null });
        try {
          const response = await fetch(
            `/api/teacher/subject-classes?user_id=${user.id}&subject_id=${subjectId}`
          );
          const data = await response.json();
          if (!response.ok) {
            setListState({
              loading: false,
              error: data?.message ?? "Unable to fetch classes.",
            });
            return;
          }
          setClasses(data?.classes ?? []);
          setListState({ loading: false, error: null });
        } catch (error) {
          setListState({
            loading: false,
            error: "Unable to reach the server.",
          });
        }
      };
      fetchClasses();

      const fetchStudents = async () => {
        try {
          const response = await fetch(
            `/api/teacher/subject-students?subject_id=${subjectId}`
          );
          const data = await response.json();
          if (response.ok) {
            setStudents(data?.students ?? []);
          }
        } catch (error) {
          return;
        }
      };
      fetchStudents();
    } catch (error) {
      return;
    }
  }, [subjectId]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Subject Classes
        </p>
        <h1 className="font-display text-3xl">Classes for this subject</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Review classes where you teach this subject.
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Assigned classes
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {classes.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Category</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading classes...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {listState.error}
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No classes assigned yet.
                  </td>
                </tr>
              ) : (
                classes.map((classItem) => (
                  <tr
                    key={classItem.id}
                    className="border-t border-[#0f4c3a]/10"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {classItem.code}
                    </td>
                    <td className="px-6 py-4">{classItem.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#0f4c3a]/10 px-3 py-1 text-xs font-semibold text-[#0f4c3a]">
                        {formatLabel(classItem.category)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Students offering this subject
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {students.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Student No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No students found.
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
                      <a
                        className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                        href={`/teacher/student-class/${student.id}`}
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
