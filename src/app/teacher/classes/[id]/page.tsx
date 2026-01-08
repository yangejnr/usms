"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  total_students?: number;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function TeacherClassDetailPage() {
  const params = useParams();
  const classId = String(params.id ?? "");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classInfo, setClassInfo] = useState<{
    name: string;
    class_group: string | null;
  } | null>(null);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  useEffect(() => {
    if (!classId) {
      return;
    }
    const fetchSubjects = async () => {
      setListState({ loading: true, error: null });
      try {
        const response = await fetch(
          `/api/teacher/class-subjects?class_id=${classId}`
        );
        const data = await response.json();
        if (!response.ok) {
          setListState({
            loading: false,
            error: data?.message ?? "Unable to fetch subjects.",
          });
          return;
        }
        setSubjects(data?.subjects ?? []);
        setClassInfo(data?.classInfo ?? null);
        setListState({ loading: false, error: null });
      } catch (error) {
        setListState({
          loading: false,
          error: "Unable to reach the server.",
        });
      }
    };
    fetchSubjects();
  }, [classId]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Class Subjects
        </p>
        <h1 className="font-display text-3xl">
          {classInfo
            ? `Subjects in ${classInfo.name}${
                classInfo.class_group ? ` - ${classInfo.class_group}` : ""
              }`
            : "Subjects in this class"}
        </h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Review subjects assigned to you for this class.
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Assigned subjects
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {subjects.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Subject</th>
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
                    Loading subjects...
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
              ) : subjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No subjects assigned yet.
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-t border-[#0f4c3a]/10"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {subject.code}
                    </td>
                    <td className="px-6 py-4">{subject.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#0f4c3a]/10 px-3 py-1 text-xs font-semibold text-[#0f4c3a]">
                        {formatLabel(subject.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {subject.total_students ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                        href={`/teacher/classes/${classId}/subjects/${subject.id}`}
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
