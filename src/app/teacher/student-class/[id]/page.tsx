"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type StudentDetail = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
  gender: string;
  school: string | null;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
  category: string;
};

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  assignment_id?: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function StudentClassDetailPage() {
  const params = useParams();
  const studentId = String(params.id ?? "");
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchDetail = async () => {
    if (!studentId) {
      return;
    }
    setState({ loading: true, error: null });
    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`);
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to load student details.",
        });
        return;
      }
      setStudent(data?.student ?? null);
      setClassItem(data?.class ?? null);
      setSubjects(data?.subjects ?? []);
      setState({ loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const fetchAll = async () => {
    try {
      const [classesResponse, subjectsResponse] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects"),
      ]);
      const classesData = await classesResponse.json();
      const subjectsData = await subjectsResponse.json();
      if (classesResponse.ok) {
        setAllClasses(classesData?.classes ?? []);
      }
      if (subjectsResponse.ok) {
        setAllSubjects(subjectsData?.subjects ?? []);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("ajs_user");
    if (raw) {
      try {
        const user = JSON.parse(raw) as { id?: string | null };
        setCurrentUserId(user.id ?? null);
      } catch (error) {
        setCurrentUserId(null);
      }
    }
    fetchDetail();
    fetchAll();
  }, [studentId]);

  const handleAssignClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass) {
      return;
    }
    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClass,
          added_by: currentUserId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to assign class.",
        });
        return;
      }
      setSelectedClass("");
      setShowClassModal(false);
      fetchDetail();
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const handleAssignSubject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classItem || !selectedSubject) {
      return;
    }
    try {
      const response = await fetch(
        `/api/school-admin/students/${studentId}/subjects`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: classItem.id,
            subject_id: selectedSubject,
            added_by: currentUserId,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to assign subject.",
        });
        return;
      }
      setSelectedSubject("");
      setShowSubjectModal(false);
      fetchDetail();
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const handleRemoveSubject = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/school-admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
          removed_by: currentUserId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to remove subject.",
        });
        return;
      }
      fetchDetail();
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const availableSubjects = allSubjects.filter((item) => {
    const notAssigned = !subjects.some((assigned) => assigned.id === item.id);
    if (!classItem) {
      return false;
    }
    const subjectCategory = item.category ?? "";
    const classCategory = classItem.category ?? "";
    const categoryMatch =
      subjectCategory === "both" || subjectCategory === classCategory;
    return notAssigned && categoryMatch;
  });

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Student Details
        </p>
        <h1 className="font-display text-3xl">Class and subjects</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Assign a class and subjects to this student.
        </p>
      </header>

      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}

      <section className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        {student ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Student No", value: student.student_no },
              {
                label: "Name",
                value: `${student.surname} ${student.firstname} ${student.othername ?? ""}`,
              },
              { label: "Gender", value: formatLabel(student.gender) },
              { label: "School", value: student.school ?? "—", span: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`space-y-2 ${item.span ? "md:col-span-2" : ""}`}
              >
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  {item.label}
                </label>
                <span className="block rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm text-[#1b1b18]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#1b1b18]/70">Loading student...</p>
        )}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0f4c3a]/10 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1b1b18]/80">Class</p>
            <p className="text-xs text-[#1b1b18]/60">
              {classItem ? "Assigned class" : "No class assigned"}
            </p>
          </div>
          <button
            className="rounded-full bg-[#0f4c3a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => setShowClassModal(true)}
          >
            Assign Class
          </button>
        </div>
        <div className="px-6 py-6">
          {classItem ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Class", value: classItem.name },
                { label: "Code", value: classItem.code },
                { label: "Category", value: formatLabel(classItem.category) },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    {item.label}
                  </label>
                  <span className="block rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3 text-sm text-[#1b1b18]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#1b1b18]/70">
              Assign a class to continue.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0f4c3a]/10 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1b1b18]/80">
              Subjects
            </p>
            <p className="text-xs text-[#1b1b18]/60">
              {subjects.length} assigned
            </p>
          </div>
          <button
            className="rounded-full bg-[#0f4c3a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => setShowSubjectModal(true)}
            disabled={!classItem}
          >
            Add Subject
          </button>
        </div>
        <div className="divide-y divide-[#0f4c3a]/10">
          {subjects.length === 0 ? (
            <div className="px-6 py-6 text-sm text-[#1b1b18]/60">
              No subjects assigned yet.
            </div>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-[#1b1b18]">
                    {subject.name}
                  </p>
                  <p className="text-xs text-[#1b1b18]/60">
                    {subject.code} • {formatLabel(subject.category)}
                  </p>
                </div>
                <button
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                  onClick={() =>
                    handleRemoveSubject(subject.assignment_id ?? subject.id)
                  }
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          showClassModal ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showClassModal}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Assign Class</p>
              <p className="text-sm text-[#1b1b18]/70">
                Select the student&apos;s class.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close assign class"
              onClick={() => setShowClassModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-4 px-6 py-6" onSubmit={handleAssignClass}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              >
                <option value="">Select a class</option>
                {allClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <button
                type="button"
                className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                onClick={() => setShowClassModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
              >
                Assign Class
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          showSubjectModal ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showSubjectModal}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Assign Subject</p>
              <p className="text-sm text-[#1b1b18]/70">
                Select subjects for the student.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close assign subject"
              onClick={() => setShowSubjectModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-4 px-6 py-6" onSubmit={handleAssignSubject}>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              >
                <option value="">Select a subject</option>
                {availableSubjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <button
                type="button"
                className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                onClick={() => setShowSubjectModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
              >
                Assign Subject
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
