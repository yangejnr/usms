"use client";

import { useEffect, useState } from "react";

type StudentItem = {
  id: string;
  student_no: string;
  surname: string;
  firstname: string;
  othername: string | null;
  gender: string;
  status?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  dob?: string | null;
  blood_group?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;
  parent_address?: string | null;
  passport_photograph?: string | null;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewStudent, setViewStudent] = useState<StudentItem | null>(null);
  const [editStudent, setEditStudent] = useState<StudentItem | null>(null);
  const [confirmStudent, setConfirmStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formState, setFormState] = useState({
    student_no: "",
    surname: "",
    firstname: "",
    othername: "",
    dob: "",
    gender: "male",
    blood_group: "",
    phone: "",
    passport_photograph: "",
    email: "",
    address: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    parent_address: "",
  });
  const [submitState, setSubmitState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const fetchStudents = async () => {
    setListState({ loading: true, error: null });
    try {
      const response = await fetch(`/api/school-admin/students`);
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch students.",
        });
        return;
      }
      setStudents(data?.students ?? []);
      setSchoolName(data?.school ?? null);
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
  }, []);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormState((prev) => ({
        ...prev,
        passport_photograph: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/school-admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to create student.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Student created.",
      });
      setShowModal(false);
      setFormState({
        student_no: "",
        surname: "",
        firstname: "",
        othername: "",
        dob: "",
        gender: "male",
        blood_group: "",
        phone: "",
        passport_photograph: "",
        email: "",
        address: "",
        parent_name: "",
        parent_phone: "",
        parent_email: "",
        parent_address: "",
      });
      fetchStudents();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editStudent) {
      return;
    }
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(
        `/api/school-admin/students/${editStudent.id}/record`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editStudent),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to update student.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Student updated.",
      });
      setEditStudent(null);
      fetchStudents();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handleDeactivate = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/school-admin/students/${studentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "inactive" }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to deactivate student.",
        });
        return;
      }
      fetchStudents();
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
        <h1 className="font-display text-3xl">Manage students</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          {schoolName
            ? `School: ${schoolName}`
            : "Register students for your school."}
        </p>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Student roster
          </p>
          <button
            className="rounded-full bg-[#0f4c3a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => {
              setSubmitState({ loading: false, error: null, success: null });
              setShowModal(true);
            }}
          >
            Add New Student
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">Student No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {listState.error}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No students found for this school.
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
                      {formatLabel(student.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setViewStudent(student)}
                        >
                          View
                        </button>
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setEditStudent(student)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmStudent({
                              id: student.id,
                              name: `${student.surname} ${student.firstname}`,
                            })
                          }
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

      {viewStudent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          aria-hidden={!viewStudent}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Student Details</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Review student biodata and guardian details.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close student view"
                onClick={() => setViewStudent(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="grid gap-6 px-6 py-6 text-sm text-[#1b1b18]/75 md:grid-cols-3">
              {[
                { label: "Student No", value: viewStudent.student_no },
                {
                  label: "Name",
                  value: `${viewStudent.surname} ${viewStudent.firstname} ${
                    viewStudent.othername ?? ""
                  }`,
                },
                { label: "Gender", value: formatLabel(viewStudent.gender) },
                { label: "Date of Birth", value: viewStudent.dob ?? "—" },
                { label: "Blood Group", value: viewStudent.blood_group ?? "—" },
                { label: "Phone", value: viewStudent.phone ?? "—" },
                { label: "Student Email", value: viewStudent.email ?? "—" },
                { label: "Address", value: viewStudent.address ?? "—" },
                { label: "Parent Name", value: viewStudent.parent_name ?? "—" },
                {
                  label: "Parent Phone",
                  value: viewStudent.parent_phone ?? "—",
                },
                {
                  label: "Parent Email",
                  value: viewStudent.parent_email ?? "—",
                },
                {
                  label: "Parent Address",
                  value: viewStudent.parent_address ?? "—",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                    {item.label}
                  </span>
                  <span className="text-left text-base font-semibold text-[#1b1b18]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#0f4c3a]/10 px-6 pb-6 pt-4">
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                  Passport Photo
                </span>
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] text-xs text-[#1b1b18]/60">
                  {viewStudent.passport_photograph ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewStudent.passport_photograph}
                      alt="Student passport"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Passport"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editStudent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          aria-hidden={!editStudent}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Edit Student</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Update student information.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close edit student"
                onClick={() => setEditStudent(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <form className="space-y-6 px-6 py-6" onSubmit={handleUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Student No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.student_no}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, student_no: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.surname}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, surname: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.firstname}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, firstname: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Other Name
                  </label>
                  <input
                    type="text"
                    value={editStudent.othername ?? ""}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev
                          ? { ...prev, othername: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editStudent.gender}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, gender: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={editStudent.email ?? ""}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, email: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editStudent.address ?? ""}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev ? { ...prev, address: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Parent Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.parent_name ?? ""}
                    onChange={(event) =>
                      setEditStudent((prev) =>
                        prev
                          ? { ...prev, parent_name: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Parent Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.parent_phone ?? ""}
                    onChange={(event) =>
                    setEditStudent((prev) =>
                      prev
                        ? { ...prev, parent_phone: event.target.value }
                        : prev
                    )
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Passport Photograph
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEditStudent((prev) =>
                        prev
                          ? {
                              ...prev,
                              passport_photograph: String(reader.result ?? ""),
                            }
                          : prev
                      );
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] text-xs text-[#1b1b18]/60">
                  {editStudent?.passport_photograph ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editStudent.passport_photograph}
                      alt="Student passport"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Passport"
                  )}
                </div>
              </div>
            </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
                <p className="text-xs text-[#1b1b18]/60">
                  Updates apply immediately to the student record.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                    onClick={() => setEditStudent(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={submitState.loading}
                  >
                    {submitState.loading ? "Updating..." : "Update Student"}
                  </button>
                </div>
              </div>
              {submitState.error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                  {submitState.error}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      {confirmStudent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          aria-hidden={!confirmStudent}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
              <p className="font-display text-2xl text-[#1b1b18]">
                Deactivate {confirmStudent?.name}?
              </p>
              <p className="mt-2 text-sm text-[#1b1b18]/70">
                This will set the student to inactive.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 px-6 py-6">
              <button
                type="button"
                className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                onClick={() => setConfirmStudent(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
                onClick={async () => {
                  if (!confirmStudent) {
                    return;
                  }
                  const id = confirmStudent.id;
                  setConfirmStudent(null);
                  await handleDeactivate(id);
                }}
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          showModal ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showModal}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Add New Student</p>
              <p className="text-sm text-[#1b1b18]/70">
                Capture student biodata and guardian details.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close add student"
              onClick={() => setShowModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3 border-b border-[#0f4c3a]/30 pb-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Student Information
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Student No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.student_no}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      student_no: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Surname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.surname}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      surname: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.firstname}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      firstname: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Other Name
                </label>
                <input
                  type="text"
                  value={formState.othername}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      othername: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formState.dob}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      dob: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formState.gender}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      gender: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Blood Group
                </label>
                <select
                  value={formState.blood_group}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      blood_group: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Phone
                </label>
                <input
                  type="text"
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Student Email
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Address
                </label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Passport Photograph
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] text-xs text-[#1b1b18]/60">
                  {formState.passport_photograph ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formState.passport_photograph}
                      alt="Student passport"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Passport"
                  )}
                </div>
              </div>
              <div className="md:col-span-3 border-b border-[#0f4c3a]/30 pb-2 pt-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                Parent/Guardian Information
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Parent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.parent_name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      parent_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Parent Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.parent_phone}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      parent_phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Parent Email
                </label>
                <input
                  type="email"
                  value={formState.parent_email}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      parent_email: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Parent Address
                </label>
                <input
                  type="text"
                  value={formState.parent_address}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      parent_address: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <p className="text-xs text-[#1b1b18]/60">
                Ensure parent contact details are accurate.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitState.loading}
                >
                  {submitState.loading ? "Saving..." : "Create Student"}
                </button>
              </div>
            </div>
            {submitState.error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {submitState.error}
              </p>
            ) : null}
            {submitState.success ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                {submitState.success}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
