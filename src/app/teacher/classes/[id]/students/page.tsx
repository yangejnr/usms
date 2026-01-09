"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type StudentItem = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
  gender: string;
  total_subjects: number;
};

type ClassInfo = {
  name: string;
  class_group: string | null;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function ClassStudentsPage() {
  const params = useParams();
  const classId = String(params.id ?? "");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  useEffect(() => {
    if (!classId) {
      return;
    }
    const fetchStudents = async () => {
      setState({ loading: true, error: null });
      try {
        const response = await fetch(
          `/api/teacher/class-students?class_id=${classId}`
        );
        const data = await response.json();
        if (!response.ok) {
          setState({
            loading: false,
            error: data?.message ?? "Unable to fetch students.",
          });
          return;
        }
        setStudents(data?.students ?? []);
        setClassInfo(data?.class_info ?? null);
        setState({ loading: false, error: null });
      } catch (error) {
        setState({
          loading: false,
          error: "Unable to reach the server.",
        });
      }
    };
    fetchStudents();
  }, [classId]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Students
        </p>
        <h1 className="font-display text-3xl">
          Students in{" "}
          <span className="font-bold">
            {classInfo
              ? `${classInfo.name}${
                  classInfo.class_group ? ` - ${classInfo.class_group}` : ""
                }`
              : "this class"}
          </span>
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          View students enrolled in{" "}
          <span className="font-semibold">
            {classInfo
              ? `${classInfo.name}${
                  classInfo.class_group ? ` - ${classInfo.class_group}` : ""
                }`
              : "this class"}
          </span>
          .
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Class students
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {students.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Student No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Subjects</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : state.error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {state.error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No students assigned yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {student.student_no}
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {student.surname} {student.firstname}{" "}
                      {student.othername ?? ""}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatLabel(student.gender)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {student.total_subjects}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        className="rounded-full border border-[#0f4c3a]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a] transition hover:border-[#0f4c3a]/60"
                        href={`/teacher/classes/${classId}/students/${student.id}/subjects`}
                      >
                        View Subjects
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
