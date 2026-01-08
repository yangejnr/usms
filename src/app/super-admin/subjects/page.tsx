"use client";

import { useEffect, useState } from "react";

type SubjectItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectItem | null>(null);
  const [viewSubject, setViewSubject] = useState<SubjectItem | null>(null);
  const [confirmSubject, setConfirmSubject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    code: "",
    category: "junior",
    status: "active",
  });
  const [submitState, setSubmitState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  const fetchSubjects = async () => {
    setListState({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/subjects");
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch subjects.",
        });
        return;
      }
      setSubjects(data?.subjects ?? []);
      setListState({ loading: false, error: null });
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to create subject.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Subject created.",
      });
      setShowModal(false);
      setFormState({
        name: "",
        code: "",
        category: "junior",
        status: "active",
      });
      fetchSubjects();
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
    if (!editSubject) {
      return;
    }
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/admin/subjects/${editSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editSubject.name,
          code: editSubject.code,
          category: editSubject.category,
          status: editSubject.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to update subject.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Subject updated.",
      });
      setEditSubject(null);
      fetchSubjects();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handleDeactivate = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to deactivate subject.",
        });
        return;
      }
      fetchSubjects();
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
            Subjects
          </p>
          <h1 className="font-display text-3xl">Manage subjects</h1>
        </div>
        <button
          className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
          onClick={() => {
            setSubmitState({ loading: false, error: null, success: null });
            setShowModal(true);
          }}
        >
          Add New Subject
        </button>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Registered subjects
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
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
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
                    No subjects yet. Add the first subject to get started.
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
                        {subject.category === "both"
                          ? "Both Junior & Senior"
                          : formatLabel(subject.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {subject.status === "active" ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formatLabel(subject.status)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatLabel(subject.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setViewSubject({ ...subject })}
                        >
                          View
                        </button>
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setEditSubject({ ...subject })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmSubject({
                              id: subject.id,
                              name: subject.name,
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

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          showModal ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showModal}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        />
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Add New Subject</p>
              <p className="text-sm text-[#1b1b18]/70">
                Register a subject for the diocesan curriculum.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close add subject"
              onClick={() => setShowModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formState.code}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Category
                </label>
                <select
                  value={formState.category}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                  <option value="both">Both Junior & Senior</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <p className="text-xs text-[#1b1b18]/60">
                Subjects can be deactivated without removing records.
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
                  {submitState.loading ? "Saving..." : "Create Subject"}
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

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          viewSubject ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!viewSubject}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewSubject(null)}
        />
        {viewSubject ? (
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Subject Details</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Review subject information.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close view subject"
                onClick={() => setViewSubject(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-[#1b1b18]/75">
              {[
                { label: "Subject Name", value: viewSubject.name },
                { label: "Subject Code", value: viewSubject.code },
                {
                  label: "Category",
                  value:
                    viewSubject.category === "both"
                      ? "Both Junior & Senior"
                      : formatLabel(viewSubject.category),
                },
                { label: "Status", value: formatLabel(viewSubject.status) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-[#0f4c3a]/10 bg-white px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-[0.2em] text-[#0f4c3a]/70">
                    {item.label}
                  </span>
                  <span className="text-left font-semibold text-[#1b1b18]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          editSubject ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!editSubject}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditSubject(null)}
        />
        {editSubject ? (
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Edit Subject</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Update subject details and status.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close edit subject"
                onClick={() => setEditSubject(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <form className="space-y-6 px-6 py-6" onSubmit={handleUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={editSubject.name}
                    onChange={(event) =>
                      setEditSubject((prev) =>
                        prev ? { ...prev, name: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={editSubject.code}
                    onChange={(event) =>
                      setEditSubject((prev) =>
                        prev
                          ? { ...prev, code: event.target.value.toUpperCase() }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Category
                  </label>
                  <select
                    value={editSubject.category}
                    onChange={(event) =>
                      setEditSubject((prev) =>
                        prev
                          ? { ...prev, category: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="both">Both Junior & Senior</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Status
                  </label>
                  <select
                    value={editSubject.status}
                    onChange={(event) =>
                      setEditSubject((prev) =>
                        prev ? { ...prev, status: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
                <p className="text-xs text-[#1b1b18]/60">
                  Updates apply immediately to this subject.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                    onClick={() => setEditSubject(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={submitState.loading}
                  >
                    {submitState.loading ? "Updating..." : "Update Subject"}
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
        ) : null}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          confirmSubject ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmSubject}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmSubject(null)}
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Deactivate {confirmSubject?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will set the subject to inactive and remove it from active
              selection lists.
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
                await handleDeactivate(id);
              }}
            >
              Yes, Deactivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
