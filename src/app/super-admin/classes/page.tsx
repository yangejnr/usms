"use client";

import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  code: string;
  category: string;
  status: string;
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [viewClass, setViewClass] = useState<ClassItem | null>(null);
  const [confirmClass, setConfirmClass] = useState<{
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

  const fetchClasses = async () => {
    setListState({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/classes");
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch classes.",
        });
        return;
      }
      setClasses(data?.classes ?? []);
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
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to create class.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Class created.",
      });
      setShowModal(false);
      setFormState({ name: "", code: "", category: "junior", status: "active" });
      fetchClasses();
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
    if (!editClass) {
      return;
    }
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/admin/classes/${editClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editClass.name,
          code: editClass.code,
          category: editClass.category,
          status: editClass.status,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to update class.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Class updated.",
      });
      setEditClass(null);
      fetchClasses();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handleDeactivate = async (classId: string) => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to deactivate class.",
        });
        return;
      }
      fetchClasses();
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
            Classes
          </p>
          <h1 className="font-display text-3xl">Manage class groups</h1>
        </div>
        <button
          className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
          onClick={() => {
            setSubmitState({ loading: false, error: null, success: null });
            setShowModal(true);
          }}
        >
          Add New Class
        </button>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Registered classes
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {classes.length} total
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
                    No classes yet. Add the first class to get started.
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
                        {classItem.category === "junior" ? "Junior" : "Senior"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {classItem.status === "active" ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formatLabel(classItem.status)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatLabel(classItem.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setViewClass({ ...classItem })}
                        >
                          View
                        </button>
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => setEditClass({ ...classItem })}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                          onClick={() =>
                            setConfirmClass({
                              id: classItem.id,
                              name: classItem.name,
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
              <p className="font-display text-2xl">Add New Class</p>
              <p className="text-sm text-[#1b1b18]/70">
                Register a class group for the portal.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close add class"
              onClick={() => setShowModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Class Name
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
                  Class Code
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
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <p className="text-xs text-[#1b1b18]/60">
                Classes can be deactivated without removing records.
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
                  {submitState.loading ? "Saving..." : "Create Class"}
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
          viewClass ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!viewClass}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setViewClass(null)}
        />
        {viewClass ? (
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Class Details</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Review class information.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close view class"
                onClick={() => setViewClass(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="space-y-4 px-6 py-6 text-sm text-[#1b1b18]/75">
              {[
                { label: "Class Name", value: viewClass.name },
                { label: "Class Code", value: viewClass.code },
                {
                  label: "Category",
                  value: viewClass.category === "junior" ? "Junior" : "Senior",
                },
                { label: "Status", value: formatLabel(viewClass.status) },
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
          editClass ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!editClass}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditClass(null)}
        />
        {editClass ? (
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
              <div>
                <p className="font-display text-2xl">Edit Class</p>
                <p className="text-sm text-[#1b1b18]/70">
                  Update class details and status.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                aria-label="Close edit class"
                onClick={() => setEditClass(null)}
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            <form className="space-y-6 px-6 py-6" onSubmit={handleUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={editClass.name}
                    onChange={(event) =>
                      setEditClass((prev) =>
                        prev ? { ...prev, name: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={editClass.code}
                    onChange={(event) =>
                      setEditClass((prev) =>
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
                    value={editClass.category}
                    onChange={(event) =>
                      setEditClass((prev) =>
                        prev
                          ? { ...prev, category: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Status
                  </label>
                  <select
                    value={editClass.status}
                    onChange={(event) =>
                      setEditClass((prev) =>
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
                  Updates apply immediately to this class.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                    onClick={() => setEditClass(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={submitState.loading}
                  >
                    {submitState.loading ? "Updating..." : "Update Class"}
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
          confirmClass ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmClass}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmClass(null)}
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              Deactivate {confirmClass?.name}?
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              This will set the class to inactive and remove it from selection
              lists.
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
    </div>
  );
}
