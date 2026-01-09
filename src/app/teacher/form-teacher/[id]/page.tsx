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
  school_session?: string | null;
  name: string;
  code: string;
  category: string;
  status?: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function FormTeacherDetailPage() {
  const params = useParams();
  const teacherId = String(params.id ?? "");
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [classGroup, setClassGroup] = useState("A");
  const [schoolSession, setSchoolSession] = useState("");
  const [classModalError, setClassModalError] = useState<string | null>(null);
  const [confirmClass, setConfirmClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [studentModal, setStudentModal] = useState<{
    classId: string;
    className: string;
  } | null>(null);
  const [students, setStudents] = useState<
    { id: string; student_no: string; surname: string; firstname: string; othername: string | null; gender: string }[]
  >([]);
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
      const response = await fetch(`/api/school-admin/form-teachers/${teacherId}`);
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

  useEffect(() => {
    fetchDetail();
    fetchAllClasses();
  }, [teacherId]);

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClass || !schoolSession) {
      setClassModalError("Class and school session are required.");
      return;
    }
    try {
      const response = await fetch(
        `/api/school-admin/form-teachers/${teacherId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_id: selectedClass,
            class_group: classGroup,
            school_session: schoolSession,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setClassModalError(data?.message ?? "Unable to assign class.");
        return;
      }
      setClassModalError(null);
      setShowModal(false);
      setSelectedClass("");
      setClassGroup("A");
      setSchoolSession("");
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
      const response = await fetch(
        `/api/school-admin/form-teachers/${teacherId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignment_id: assignmentId }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setState({
          loading: false,
          error: data?.message ?? "Unable to remove assignment.",
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

  const availableClasses = allClasses.filter(
    (item) => !classes.some((assigned) => assigned.id === item.id)
  );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Form Teacher
        </p>
        <h1 className="font-display text-3xl">Form teacher assignments</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Assign form teacher responsibilities for this staff member.
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
              { label: "Status", value: formatLabel(teacher.status) },
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
              Each class has one active form teacher at a time.
            </p>
          </div>
          <button
            className="rounded-full bg-[#0f4c3a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0f4c3a]/25 transition hover:translate-y-[-1px]"
            onClick={() => {
              setClassModalError(null);
              setShowModal(true);
            }}
          >
            Assign Class
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Session</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No form teacher classes assigned yet.
                  </td>
                </tr>
              ) : (
                classes.map((item) => (
                  <tr key={item.assignment_id ?? item.id} className="border-t border-[#0f4c3a]/10">
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {formatLabel(item.category)}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {item.class_group ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-[#1b1b18]/70">
                      {item.school_session ?? "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button
                          className="rounded-full border border-[#0f4c3a]/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a] transition hover:border-[#0f4c3a] hover:bg-[#0f4c3a] hover:text-white"
                          onClick={async () => {
                            setStudentModal({
                              classId: item.id,
                              className: item.name,
                            });
                            try {
                              const response = await fetch(
                                `/api/school-admin/classes/${item.id}/students`
                              );
                              const data = await response.json();
                              if (response.ok) {
                                setStudents(data?.students ?? []);
                              } else {
                                setStudents([]);
                              }
                            } catch (error) {
                              setStudents([]);
                            }
                          }}
                        >
                          View Students
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 transition hover:border-red-400 hover:bg-red-50"
                          onClick={() =>
                            setConfirmClass({
                              id: item.assignment_id ?? item.id,
                              name: item.name,
                            })
                          }
                        >
                          Remove
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

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Assign Class</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Choose a class for this form teacher.
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
                  <option value="">Select class</option>
                  {availableClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Group
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
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  School Session
                </label>
                <input
                  value={schoolSession}
                  onChange={(event) => setSchoolSession(event.target.value)}
                  placeholder="e.g. 2024/2025"
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0f4c3a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
                >
                  Assign
                </button>
              </div>
              {classModalError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {classModalError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {confirmClass ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
              <p className="font-display text-2xl">
                Remove {confirmClass.name}?
              </p>
              <p className="mt-2 text-sm text-[#1b1b18]/70">
                This will deactivate the form teacher assignment.
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
                  await handleDeactivate(confirmClass.id);
                  setConfirmClass(null);
                }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {studentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Students in {studentModal.className}</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Students currently assigned to this class.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close students modal"
                onClick={() => setStudentModal(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              <table className="min-w-[700px] w-full text-left text-sm">
                <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
                  <tr>
                    <th className="px-4 py-3">Student No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-sm text-[#1b1b18]/60"
                      >
                        No students assigned.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="border-t border-[#0f4c3a]/10">
                        <td className="px-4 py-3 text-[#1b1b18]/70">
                          {student.student_no}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1b1b18]">
                          {student.surname} {student.firstname}{" "}
                          {student.othername ?? ""}
                        </td>
                        <td className="px-4 py-3 text-[#1b1b18]/70">
                          {formatLabel(student.gender)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
