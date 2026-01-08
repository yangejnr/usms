"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type TeacherDetail = {
  id: string;
  account_id: string | null;
  full_name: string | null;
  email: string;
  status: string;
  school: string | null;
};

type ClassItem = {
  id: string;
  assignment_id?: string;
  class_group?: string;
  name: string;
  code: string;
  category: string;
  total_subjects?: number;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function AssignClassDetailPage() {
  const params = useParams();
  const teacherId = String(params.id ?? "");
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [classGroup, setClassGroup] = useState("A");
  const [classDetail, setClassDetail] = useState<ClassItem | null>(null);
  const [classSubjects, setClassSubjects] = useState<
    { id: string; name: string; code: string; category: string; assignment_id?: string }[]
  >([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [allSubjects, setAllSubjects] = useState<
    { id: string; name: string; code: string; category: string }[]
  >([]);
  const [confirmClass, setConfirmClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmSubject, setConfirmSubject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchDetail = async () => {
    if (!teacherId) {
      return;
    }
    setState({ loading: true, error: null });
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`);
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to load teacher details.",
        });
        return;
      }
      setTeacher(data?.teacher ?? null);
      setClasses(data?.classes ?? []);
      setState({ loading: false, error: null });
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const fetchAllClasses = async () => {
    try {
      const response = await fetch("/api/catalog/classes");
      const data = await response.json();
      if (response.ok) {
        setAllClasses(data?.classes ?? []);
      }
    } catch (error) {
      return;
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const response = await fetch("/api/catalog/subjects");
      const data = await response.json();
      if (response.ok) {
        setAllSubjects(data?.subjects ?? []);
      }
    } catch (error) {
      return;
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchAllClasses();
    fetchAllSubjects();
  }, [teacherId]);

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass) {
      return;
    }
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClass,
          class_group: classGroup,
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
      setShowModal(false);
      setSelectedClass("");
      setClassGroup("A");
      fetchDetail();
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const handleDeactivate = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/school-admin/teachers/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignmentId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to deactivate assignment.",
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

  const openClassView = async (item: ClassItem) => {
    setClassDetail(item);
    setShowSubjectModal(true);
    setSelectedSubject("");
    try {
      const response = await fetch(
        `/api/school-admin/teachers/${teacherId}/subjects?class_id=${item.id}`
      );
      const data = await response.json();
      if (response.ok) {
        setClassSubjects(data?.subjects ?? []);
      }
    } catch (error) {
      setClassSubjects([]);
    }
  };

  const handleAssignSubject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classDetail || !selectedSubject) {
      return;
    }
    try {
      const response = await fetch(
        `/api/school-admin/teachers/${teacherId}/subjects`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: classDetail.id,
            subject_id: selectedSubject,
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
      openClassView(classDetail);
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
      const response = await fetch(
        `/api/school-admin/teachers/${teacherId}/subjects`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignment_id: assignmentId,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to remove subject.",
        });
        return;
      }
      if (classDetail) {
        openClassView(classDetail);
      }
    } catch (error) {
      setState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const availableClasses = allClasses.filter(
    (item) => !classes.some((assigned) => assigned.id === item.id)
  );

  const availableSubjects = allSubjects.filter((item) => {
    const notAssigned = !classSubjects.some((assigned) => assigned.id === item.id);
    const classCategory = classDetail?.category ?? "";
    const subjectCategory = item.category ?? "";
    const categoryMatch =
      subjectCategory === "both" ||
      subjectCategory === classCategory ||
      classCategory === "";
    return notAssigned && categoryMatch;
  });

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Teacher Details
        </p>
        <h1 className="font-display text-3xl">Class setup</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Assign classes to this teacher and review current allocations.
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        {state.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {state.error}
          </p>
        ) : null}
        {teacher ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Name", value: teacher.full_name ?? "—" },
              { label: "Account ID", value: teacher.account_id ?? "—" },
              { label: "Email", value: teacher.email },
              {
                label: "Status",
                value: formatLabel(teacher.status),
              },
              { label: "School", value: teacher.school ?? "—", span: true },
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
          <p className="text-sm text-[#1b1b18]/70">Loading teacher...</p>
        )}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0f4c3a]/10 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-[#1b1b18]/80">
              Assigned classes
            </p>
            <p className="text-xs text-[#1b1b18]/60">
              {classes.length} total
            </p>
          </div>
          <button
            className="rounded-full bg-[#0f4c3a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => setShowModal(true)}
          >
            Add New Class
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Subjects</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
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
                        {classItem.total_subjects ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {classItem.class_group ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => openClassView(classItem)}
                        >
                          View
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmClass({
                              id: classItem.assignment_id ?? "",
                              name: classItem.name,
                            })
                          }
                          disabled={!classItem.assignment_id}
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
          showModal ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showModal}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Assign Class</p>
              <p className="text-sm text-[#1b1b18]/70">
                Choose a class to assign to this teacher.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close assign class"
              onClick={() => setShowModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-4 px-6 py-6" onSubmit={handleAssign}>
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
                {availableClasses.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} ({classItem.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Category
              </label>
              <select
                value={classGroup}
                onChange={(event) => setClassGroup(event.target.value)}
                className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
              >
                {["A", "B", "C", "D", "E", "F", "G"].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <button
                type="button"
                className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                onClick={() => setShowModal(false)}
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
        {classDetail ? (
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">
                  {classDetail.name} subjects
                </p>
                <p className="text-sm text-[#1b1b18]/70">
                  Assign subjects for this class and teacher.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close subject modal"
                onClick={() => setShowSubjectModal(false)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="px-6 py-6">
              <form className="space-y-4" onSubmit={handleAssignSubject}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Add Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(event) => setSelectedSubject(event.target.value)}
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                    onClick={() => setShowSubjectModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
                  >
                    Assign Subject
                  </button>
                </div>
              </form>
              <div className="mt-6 rounded-2xl border border-[#0f4c3a]/10 bg-white">
                <div className="border-b border-[#0f4c3a]/10 px-4 py-3 text-sm font-semibold text-[#1b1b18]/80">
                  Assigned subjects
                </div>
                <div className="divide-y divide-[#0f4c3a]/10">
                  {classSubjects.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[#1b1b18]/60">
                      No subjects assigned yet.
                    </div>
                  ) : (
                    classSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between px-4 py-3 text-sm"
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
                          type="button"
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmSubject({
                              id: subject.assignment_id ?? subject.id,
                              name: subject.name,
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          confirmClass ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmClass}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Deactivate {confirmClass?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will remove all subject assignments for this class.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <button
              type="button"
              className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              onClick={() => setConfirmClass(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
              onClick={async () => {
                if (!confirmClass) {
                  return;
                }
                const id = confirmClass.id;
                setConfirmClass(null);
                await handleDeactivate(id);
              }}
            >
              Yes, Deactivate
            </button>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          confirmSubject ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmSubject}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Remove {confirmSubject?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will set the subject assignment to inactive.
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <button
              type="button"
              className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              onClick={() => setConfirmSubject(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
              onClick={async () => {
                if (!confirmSubject) {
                  return;
                }
                const id = confirmSubject.id;
                setConfirmSubject(null);
                await handleRemoveSubject(id);
              }}
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
