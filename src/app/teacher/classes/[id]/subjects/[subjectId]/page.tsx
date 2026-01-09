"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type StudentItem = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
  score_id?: string | null;
  assess_1?: number | null;
  assess_2?: number | null;
  test_1?: number | null;
  test_2?: number | null;
  exam?: number | null;
  total?: number | null;
  total_students?: number;
  avg_total?: number | null;
  position?: number | null;
};

type SubjectInfo = {
  name: string | null;
};

type ClassInfo = {
  code: string | null;
  class_group: string | null;
  school_session: string | null;
};

const formatScore = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : value.toString();

export default function ClassSubjectStudentsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classId = String(params.id ?? "");
  const subjectId = String(params.subjectId ?? "");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<SubjectInfo | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [schoolSession, setSchoolSession] = useState("");
  const [schoolTerm, setSchoolTerm] = useState("First Term");
  const [scoreModal, setScoreModal] = useState<{
    mode: "add" | "edit";
    student: StudentItem | null;
  } | null>(null);
  const [removeScore, setRemoveScore] = useState<StudentItem | null>(null);
  const [scoreValue, setScoreValue] = useState("");
  const [scoreType, setScoreType] = useState("Assess1");
  const [scoreFormError, setScoreFormError] = useState<string | null>(null);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchStudents = async (session = "", term = schoolTerm) => {
    if (!classId || !subjectId) {
      return;
    }
    setListState({ loading: true, error: null });
    try {
      const sessionParam = session || searchParams.get("school_session") || "";
      const termParam = term || searchParams.get("school_term") || "";
      const query = new URLSearchParams({
        class_id: classId,
        subject_id: subjectId,
      });
      if (sessionParam) {
        query.set("school_session", sessionParam);
      }
      if (termParam) {
        query.set("school_term", termParam);
      }
      const response = await fetch(
        `/api/teacher/class-subject-students?${query.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch students.",
        });
        return;
      }
      setStudents(data?.students ?? []);
      setSubjectInfo({ name: data?.subject_name ?? null });
      setClassInfo(data?.class_info ?? null);
      if (!schoolSession && data?.class_info?.school_session) {
        setSchoolSession(data.class_info.school_session);
      }
      if (data?.school_term) {
        setSchoolTerm(data.school_term);
      }
      setListState({ loading: false, error: null });
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [classId, subjectId, searchParams]);

  const scoreKeyMap: Record<string, keyof StudentItem> = {
    Assess1: "assess_1",
    Assess2: "assess_2",
    Test1: "test_1",
    Test2: "test_2",
    Exams: "exam",
  };

  const getScoreValue = (student: StudentItem, type: string) => {
    const key = scoreKeyMap[type] ?? "assess_1";
    const value = student[key];
    return value === null || value === undefined ? "" : String(value);
  };

  const openScoreModal = (mode: "add" | "edit", student: StudentItem) => {
    setScoreModal({ mode, student });
    setScoreType("Assess1");
    setScoreValue(getScoreValue(student, "Assess1"));
    setScoreFormError(null);
  };

  const handleSaveScore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scoreModal?.student) {
      return;
    }
    if (!schoolSession || !schoolTerm) {
      setScoreFormError("School session and term are required.");
      return;
    }
    try {
      const baseScores = {
        assess_1: scoreModal.student.assess_1 ?? 0,
        assess_2: scoreModal.student.assess_2 ?? 0,
        test_1: scoreModal.student.test_1 ?? 0,
        test_2: scoreModal.student.test_2 ?? 0,
        exam: scoreModal.student.exam ?? 0,
      };
      const scoreKey = scoreKeyMap[scoreType] ?? "assess_1";
      const scoreNumber = scoreValue === "" ? 0 : Number(scoreValue);
      const payloadScores = {
        ...baseScores,
        [scoreKey]: Number.isNaN(scoreNumber) ? 0 : scoreNumber,
      };
      const payload = {
        student_id: scoreModal.student.id,
        class_id: classId,
        subject_id: subjectId,
        school_session: schoolSession,
        school_term: schoolTerm,
        ...payloadScores,
      };
      const response = await fetch("/api/teacher/student-scores", {
        method: scoreModal.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body:
          scoreModal.mode === "edit"
            ? JSON.stringify({
                score_id: scoreModal.student.score_id,
                ...payload,
              })
            : JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setScoreFormError(data?.message ?? "Unable to save score.");
        return;
      }
      setScoreModal(null);
      setScoreFormError(null);
      fetchStudents(schoolSession, schoolTerm);
    } catch (error) {
      setScoreFormError("Unable to reach the server.");
    }
  };

  const handleRemoveScore = async () => {
    if (!removeScore?.score_id) {
      setRemoveScore(null);
      return;
    }
    try {
      const response = await fetch("/api/teacher/student-scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score_id: removeScore.score_id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to remove score.",
        });
        return;
      }
      setRemoveScore(null);
      fetchStudents(schoolSession, schoolTerm);
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
          Students
        </p>
        <h1 className="font-display text-3xl">
          Students offering{" "}
          <span className="font-bold">
            {subjectInfo?.name ?? "this subject"}
          </span>
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          {classInfo
            ? `Class: ${classInfo.code ?? "—"}${
                classInfo.class_group ? ` - ${classInfo.class_group}` : ""
              }${
                classInfo.school_session ? ` · ${classInfo.school_session}` : ""
              }${schoolTerm ? ` · ${schoolTerm}` : ""}`
            : "Review the student list for this class subject."}
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
            onClick={() => fetchStudents(schoolSession, schoolTerm)}
          >
            Search
          </button>
        </div>
      </section>

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
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Student No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Assess(1)</th>
                <th className="px-6 py-4">Assess(2)</th>
                <th className="px-6 py-4">Test(1)</th>
                <th className="px-6 py-4">Test(2)</th>
                <th className="px-6 py-4">Exams</th>
                <th className="px-6 py-4">Students</th>
                    <th className="px-6 py-4">Avg</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                        colSpan={12}
                        className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                      >
                        Loading students...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                        colSpan={12}
                        className="px-6 py-10 text-center text-sm text-red-600"
                      >
                        {listState.error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                        colSpan={12}
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
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(student.assess_1)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(student.assess_2)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(student.test_1)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(student.test_2)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatScore(student.exam)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {student.total_students ?? 0}
                    </td>
                        <td className="px-6 py-4 text-[#1b1b18]/70">
                          {formatScore(student.avg_total ?? null)}
                        </td>
                        <td className="px-6 py-4 text-[#1b1b18]/70">
                          {formatScore(student.total ?? null)}
                        </td>
                        <td className="px-6 py-4 text-[#1b1b18]/70">
                          {student.position ?? "—"}
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        {student.score_id ? (
                          <>
                            <button
                              className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                              onClick={() => openScoreModal("edit", student)}
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                              onClick={() => setRemoveScore(student)}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                            onClick={() => openScoreModal("add", student)}
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {scoreModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">
                  {scoreModal.mode === "edit" ? "Edit Score" : "Add Score"}
                </p>
                <p className="text-sm text-[#1b1b18]/70">
                  {scoreModal.student?.surname} {scoreModal.student?.firstname}{" "}
                  {scoreModal.student?.othername ?? ""} • {schoolSession} •{" "}
                  {schoolTerm}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close score modal"
                onClick={() => setScoreModal(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <form className="space-y-4 px-6 py-6" onSubmit={handleSaveScore}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Type
                  </label>
                  <select
                    value={scoreType}
                    onChange={(event) => {
                      const nextType = event.target.value;
                      setScoreType(nextType);
                      if (scoreModal?.student) {
                        setScoreValue(getScoreValue(scoreModal.student, nextType));
                      }
                    }}
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    {["Assess1", "Assess2", "Test1", "Test2", "Exams"].map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Score
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={scoreValue}
                    onChange={(event) => setScoreValue(event.target.value)}
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-[#0f4c3a]/10 pt-4">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setScoreModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
                >
                  Save
                </button>
              </div>
              {scoreFormError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {scoreFormError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {removeScore ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="px-6 py-6">
              <p className="font-display text-xl">
                Remove score for {removeScore.student_no}?
              </p>
              <p className="mt-2 text-sm text-[#1b1b18]/70">
                This will mark the score as inactive for {schoolTerm} •{" "}
                {schoolSession || "session"}.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setRemoveScore(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-200 transition hover:translate-y-[-1px]"
                  onClick={handleRemoveScore}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
