"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ClassItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  school_session?: string | null;
  total_students?: number;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function TeacherSubjectDetailPage() {
  const params = useParams();
  const subjectId = String(params.id ?? "");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjectName, setSubjectName] = useState("this subject");
  const [schoolSession, setSchoolSession] = useState("");
  const [schoolTerm, setSchoolTerm] = useState("First Term");
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchClasses = async (session = "", term = schoolTerm) => {
    if (!subjectId) {
      return;
    }
    setListState({ loading: true, error: null });
    try {
      const query = new URLSearchParams({ subject_id: subjectId });
      if (session) {
        query.set("school_session", session);
      }
      if (term) {
        query.set("school_term", term);
      }
      const response = await fetch(`/api/teacher/subject-classes?${query}`);
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch classes.",
        });
        return;
      }
      setClasses(data?.classes ?? []);
      if (!schoolSession && data?.classes?.[0]?.school_session) {
        setSchoolSession(data.classes[0].school_session);
      }
      setSubjectName(data?.subject_name ?? "this subject");
      setListState({ loading: false, error: null });
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [subjectId]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Subject Classes
        </p>
        <h1 className="font-display text-3xl">
          Classes for <span className="font-bold">{subjectName}</span>
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Review classes where you teach this subject.
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
            onClick={() => fetchClasses(schoolSession, schoolTerm)}
          >
            Search
          </button>
        </div>
      </section>

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
                <th className="px-6 py-4">Students</th>
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
                    Loading classes...
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
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {classItem.total_students ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                        href={`/teacher/classes/${classItem.id}/subjects/${subjectId}?school_session=${encodeURIComponent(
                          schoolSession
                        )}&school_term=${encodeURIComponent(schoolTerm)}`}
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
