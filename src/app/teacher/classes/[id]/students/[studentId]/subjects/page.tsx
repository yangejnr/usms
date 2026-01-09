"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  total_students: number;
  school_session: string | null;
  school_term: string | null;
  assess_1: number | null;
  assess_2: number | null;
  test_1: number | null;
  test_2: number | null;
  exam: number | null;
  total: number | null;
  avg_total: number | null;
  position: number | null;
};

type StudentInfo = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
};

type ClassInfo = {
  name: string;
  code: string | null;
  class_group: string | null;
  school_session: string | null;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const formatScore = (value: number | null) =>
  value === null || Number.isNaN(value) ? "—" : value.toString();

export default function StudentSubjectsPage() {
  const params = useParams();
  const classId = String(params.id ?? "");
  const studentId = String(params.studentId ?? "");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [schoolSession, setSchoolSession] = useState("");
  const [schoolTerm, setSchoolTerm] = useState("First Term");
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchSubjects = async (session = "", term = schoolTerm) => {
    if (!classId || !studentId) {
      return;
    }
    setState({ loading: true, error: null });
    try {
      const query = new URLSearchParams({
        student_id: studentId,
        class_id: classId,
      });
      if (session) {
        query.set("school_session", session);
      }
      if (term) {
        query.set("school_term", term);
      }
      const response = await fetch(
        `/api/teacher/student-subjects?${query.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to fetch subjects.",
        });
        return;
      }
      setSubjects(data?.subjects ?? []);
      setStudent(data?.student ?? null);
      setClassInfo(data?.class_info ?? null);
      if (!schoolSession) {
        setSchoolSession(data?.class_info?.school_session ?? "");
      }
      setState({ loading: false, error: null });
    } catch (error) {
      setState({ loading: false, error: "Unable to reach the server." });
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [classId, studentId]);

  const studentName = student
    ? `${student.surname} ${student.firstname} ${student.othername ?? ""}`.trim()
    : "Student";

  const classLabel = classInfo
    ? `Class: ${classInfo.code ?? classInfo.name}${
        classInfo.class_group ? ` - ${classInfo.class_group}` : ""
      }${classInfo.school_session ? ` · ${classInfo.school_session}` : ""}`
    : "Class";

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Subjects
        </p>
        <h1 className="font-display text-3xl">
          Subjects for <span className="font-bold">{studentName}</span>
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          <span className="font-semibold text-[#1b1b18]">{classLabel}</span>
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              School Session
            </label>
            <input
              value={schoolSession}
              onChange={(event) => setSchoolSession(event.target.value)}
              placeholder="e.g. 2024/2025"
              className="mt-2 w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] focus:border-[#0f4c3a] focus:outline-none"
            />
          </div>
          <div className="min-w-[200px]">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
              School Term
            </label>
            <select
              value={schoolTerm}
              onChange={(event) => setSchoolTerm(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] focus:border-[#0f4c3a] focus:outline-none"
            >
              {["First Term", "Second Term", "Third Term"].map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          <button
            className="rounded-full bg-[#0f4c3a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => fetchSubjects(schoolSession, schoolTerm)}
          >
            Search
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Subject performance
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {subjects.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Assess(1)</th>
                <th className="px-6 py-4">Assess(2)</th>
                <th className="px-6 py-4">Test(1)</th>
                <th className="px-6 py-4">Test(2)</th>
                <th className="px-6 py-4">Exams</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Students</th>
                <th className="px-6 py-4">Avg</th>
                <th className="px-6 py-4">Position</th>
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading subjects...
                  </td>
                </tr>
              ) : state.error ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {state.error}
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No Result available for{" "}
                    {schoolSession ? schoolSession : "the selected session"}{" "}
                    {schoolTerm ? `- ${schoolTerm}` : ""}.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {subject.name}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.assess_1)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.assess_2)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.test_1)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.test_2)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.exam)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.total)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {subject.total_students}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(subject.avg_total)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {subject.position ?? "—"}
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
