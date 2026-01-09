"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  total_students: number;
  score_id?: string | null;
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

const formatComputed = (value: number | null) => {
  if (value === null) {
    return "—";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "—";
  }
  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(2);
};

export default function StudentSubjectsPage() {
  const params = useParams();
  const classId = String(params.id ?? "");
  const studentId = String(params.studentId ?? "");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subjectsAll, setSubjectsAll] = useState<SubjectItem[]>([]);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [schoolSession, setSchoolSession] = useState("");
  const [schoolTerm, setSchoolTerm] = useState("First Term");
  const [showPending, setShowPending] = useState(false);
  const [approvalState, setApprovalState] = useState<{
    approved: boolean;
    canApprove: boolean;
  }>({ approved: false, canApprove: false });
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
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
      const nextSubjects = data?.subjects ?? [];
      const nextSubjectsAll = data?.subjects_all ?? data?.subjects ?? [];
      setSubjects(nextSubjects);
      setSubjectsAll(nextSubjectsAll);
      setStudent(data?.student ?? null);
      setClassInfo(data?.class_info ?? null);
      if (!schoolSession) {
        setSchoolSession(
          data?.class_info?.school_session ??
            nextSubjectsAll[0]?.school_session ??
            ""
        );
      }
      setState({ loading: false, error: null });
    } catch (error) {
      setState({ loading: false, error: "Unable to reach the server." });
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [classId, studentId]);

  useEffect(() => {
    const fetchApproval = async () => {
      const resolvedSession =
        schoolSession ||
        classInfo?.school_session ||
        subjectsAll[0]?.school_session ||
        "";
      if (!classId || !resolvedSession || !schoolTerm) {
        return;
      }
      try {
        const query = new URLSearchParams({
          class_id: classId,
          school_session: resolvedSession,
          school_term: schoolTerm,
        });
        const response = await fetch(
          `/api/teacher/result-approval?${query.toString()}`
        );
        const data = await response.json();
        if (!response.ok) {
          setApprovalState({ approved: false, canApprove: false });
          return;
        }
        setApprovalState({
          approved: Boolean(data?.approved),
          canApprove: Boolean(data?.can_approve),
        });
      } catch (error) {
        setApprovalState({ approved: false, canApprove: false });
      }
    };
    fetchApproval();
  }, [classId, schoolSession, schoolTerm, classInfo, subjectsAll]);

  const studentName = student
    ? `${student.surname} ${student.firstname} ${student.othername ?? ""}`.trim()
    : "Student";

  const classLabel = classInfo
    ? `Class: ${classInfo.code ?? classInfo.name}${
        classInfo.class_group ? ` - ${classInfo.class_group}` : ""
      }${classInfo.school_session ? ` · ${classInfo.school_session}` : ""}`
    : "Class";

  const subjectTotals = subjects
    .map((subject) => Number(subject.total))
    .filter((value) => Number.isFinite(value));
  const totalScore = subjectTotals.reduce((sum, value) => sum + value, 0);
  const scoredSubjects = subjectTotals.length;
  const averageScore = scoredSubjects ? totalScore / scoredSubjects : 0;
  const totalStudents = subjects.reduce(
    (max, subject) => Math.max(max, subject.total_students ?? 0),
    0
  );
  const position =
    subjects.find((subject) => subject.position !== null)?.position ?? null;
  const pendingSubjects = subjectsAll.filter((subject) => !subject.score_id);

  const handleApprove = async () => {
    setApproveError(null);
    if (!classId || !schoolSession || !schoolTerm) {
      setApproveError("School session and term are required.");
      return;
    }
    try {
      const response = await fetch("/api/teacher/result-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId,
          school_session: schoolSession,
          school_term: schoolTerm,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setApproveError(data?.message ?? "Unable to approve results.");
        return;
      }
      setApprovalState((prev) => ({ ...prev, approved: true }));
      setApproveModalOpen(false);
    } catch (error) {
      setApproveError("Unable to reach the server.");
    }
  };

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

      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-[#0f4c3a]/10">
        <h2 className="font-display text-xl text-[#1b1b18]">
          Result Summary
        </h2>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                Total Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1b1b18]">
                {formatComputed(totalScore)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                No of Subjects
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1b1b18]">
                {subjects.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                Subjects
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1b1b18]">
                {subjectsAll.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                Average Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1b1b18]">
                {formatComputed(averageScore)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                Position
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1b1b18]">
                {position ?? "—"}{" "}
                {totalStudents ? `out of ${totalStudents}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-[#0f4c3a]/10 bg-white/70 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                Pending
              </p>
              <button
                type="button"
                className="mt-2 text-left text-2xl font-semibold text-[#0f4c3a] underline decoration-[#0f4c3a]/40 underline-offset-4"
                onClick={() => setShowPending(true)}
              >
                {pendingSubjects.length}
              </button>
            </div>
          </div>
          <div className="flex min-w-[180px] items-start justify-end">
            {approvalState.approved ? (
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full bg-[#0f4c3a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]">
                  Approved
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/60">
                  Form Teacher Only
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[#0f4c3a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
                  onClick={() => setApproveModalOpen(true)}
                >
                  Approve Result
                </button>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/60">
                  Form Teacher Only
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {showPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Pending Subjects</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Subjects without scores for {schoolTerm} •{" "}
                  {schoolSession || "session"}.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close pending subjects"
                className="rounded-full border border-[#0f4c3a]/10 px-3 py-2 text-sm text-[#0f4c3a] transition hover:bg-white"
                onClick={() => setShowPending(false)}
              >
                ✕
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
              {pendingSubjects.length === 0 ? (
                <p className="text-sm text-[#1b1b18]/70">
                  No pending subjects for the selected session and term.
                </p>
              ) : (
                <ul className="space-y-3">
                  {pendingSubjects.map((subject) => (
                    <li
                      key={subject.id}
                      className="flex items-center justify-between rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-[#1b1b18]">
                        {subject.name}
                      </span>
                      <span className="text-xs uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                        Pending
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {approveModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Approve Result</p>
                <p className="text-sm text-[#1b1b18]/70">
                  This will lock scores for {schoolTerm} •{" "}
                  {schoolSession || "session"}.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close approval modal"
                className="rounded-full border border-[#0f4c3a]/10 px-3 py-2 text-sm text-[#0f4c3a] transition hover:bg-white"
                onClick={() => setApproveModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-[#1b1b18]/70">
                Once approved, the result cannot be edited. Please confirm.
              </p>
              {approveError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {approveError}
                </p>
              ) : null}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setApproveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
                  onClick={handleApprove}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
