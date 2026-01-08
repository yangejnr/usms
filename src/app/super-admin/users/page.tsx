"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [confirmUser, setConfirmUser] = useState<{
    id: string;
    name: string;
    action: "activate" | "deactivate";
  } | null>(null);
  const [editUser, setEditUser] = useState<{
    id: string;
    account_id: string | null;
    full_name: string | null;
    email: string;
    role: string;
    status: string;
    category: string;
    school: string | null;
  } | null>(null);
  const [users, setUsers] = useState<
    {
      id: string;
      account_id: string | null;
      full_name: string | null;
      email: string;
      user_role: string;
      status: string;
      category?: string;
      school?: string | null;
    }[]
  >([]);
  const [listState, setListState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });
  const [formState, setFormState] = useState({
    full_name: "",
    account_id: "",
    email: "",
    category: "school",
    role: "teacher",
    status: "active",
    school: "",
  });
  const [submitState, setSubmitState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null,
  });

  const updateField = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const roleOptions =
    formState.category === "diocese"
      ? ["Admin", "Clerk", "Editor"]
      : ["Teacher", "Bursar"];

  const editRoleOptions =
    editUser?.category === "diocese"
      ? ["Admin", "Clerk", "Editor"]
      : ["Teacher", "Bursar"];

  const formatLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

  const fetchUsers = async () => {
    setListState({ loading: true, error: null });
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to fetch users.",
        });
        return;
      }
      setUsers(data?.users ?? []);
      setListState({ loading: false, error: null });
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formState.full_name,
          email: formState.email,
          role: formState.role,
          status: formState.status,
          school: formState.school,
          category: formState.category,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to create user.",
          success: null,
        });
        return;
      }

      setSubmitState({
        loading: false,
        error: null,
        success: "User created and email sent.",
      });
      setShowModal(false);
      fetchUsers();
      setFormState({
        full_name: "",
        account_id: "",
        email: "",
        category: "school",
        role: "teacher",
        status: "active",
        school: "",
      });
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to delete user.",
        });
        return;
      }

      fetchUsers();
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setListState({
          loading: false,
          error: data?.message ?? "Unable to activate user.",
        });
        return;
      }

      fetchUsers();
    } catch (error) {
      setListState({
        loading: false,
        error: "Unable to reach the server.",
      });
    }
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser) {
      return;
    }
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editUser.full_name ?? "",
          email: editUser.email,
          role: editUser.role,
          status: editUser.status,
          category: editUser.category,
          school: editUser.school ?? "",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to update user.",
          success: null,
        });
        return;
      }

      setSubmitState({
        loading: false,
        error: null,
        success: "User updated.",
      });
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
            Users
          </p>
          <h1 className="font-display text-3xl">Manage user accounts</h1>
        </div>
        <button
          className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
          onClick={() => {
            setSubmitState({ loading: false, error: null, success: null });
            setShowModal(true);
          }}
        >
          Add New User
        </button>
      </header>

      <section className="rounded-3xl border border-white/70 bg-white/80 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="flex items-center justify-between border-b border-[#0f4c3a]/10 px-6 py-4">
          <p className="text-sm font-semibold text-[#1b1b18]/80">
            Existing users
          </p>
          <span className="rounded-full bg-[#d9c7aa]/60 px-3 py-1 text-xs font-semibold text-[#1b1b18]">
            {users.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#f1eadc] text-xs uppercase tracking-[0.2em] text-[#0f4c3a]">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {listState.loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : listState.error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-red-600"
                  >
                    {listState.error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-[#1b1b18]/60"
                  >
                    No users yet. Add your first admin to get started.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-[#0f4c3a]/10"
                  >
                    <td className="px-6 py-4 font-semibold text-[#1b1b18]">
                      {user.account_id ?? user.id}
                    </td>
                    <td className="px-6 py-4">
                      {user.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-[#0f4c3a]/10 px-3 py-1 text-xs font-semibold text-[#0f4c3a]">
                        {formatLabel(user.user_role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {formatLabel(user.category ?? "school")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.status === "active" ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {formatLabel(user.status)}
                        </span>
                      ) : user.status === "suspended" ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {formatLabel(user.status)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatLabel(user.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <button className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white">
                          View
                        </button>
                        <button
                          className="rounded-full border border-[#0f4c3a]/20 px-3 py-1 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-white"
                          onClick={() => {
                            setSubmitState({
                              loading: false,
                              error: null,
                              success: null,
                            });
                            setEditUser({
                              id: user.id,
                              account_id: user.account_id ?? null,
                              full_name: user.full_name ?? "",
                              email: user.email,
                              role: user.user_role,
                              status: user.status,
                              category: user.category ?? "school",
                              school: user.school ?? "",
                            });
                          }}
                        >
                          Edit
                        </button>
                        {user.status === "inactive" ? (
                          <button
                            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                            onClick={() =>
                              setConfirmUser({
                                id: user.id,
                                name: user.full_name ?? user.email,
                                action: "activate",
                              })
                            }
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                            onClick={() =>
                              setConfirmUser({
                                id: user.id,
                                name: user.full_name ?? user.email,
                                action: "deactivate",
                              })
                            }
                          >
                            Deactivate
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
              <p className="font-display text-2xl">Add New User</p>
              <p className="text-sm text-[#1b1b18]/70">
                Create diocesan or school-level accounts with defined roles.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close add user"
              onClick={() => setShowModal(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={formState.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Account ID
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated"
                  value={formState.account_id}
                  readOnly
                  className="w-full rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] px-4 py-3 text-sm text-[#1b1b18]/70 shadow-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="user@school.edu.ng"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Category
                </label>
                <select
                  value={formState.category}
                  onChange={(event) => {
                    const category = event.target.value;
                    const nextRole =
                      category === "diocese" ? "admin" : "teacher";
                    setFormState((prev) => ({
                      ...prev,
                      category,
                      role: nextRole,
                      school: category === "diocese" ? "" : prev.school,
                    }));
                  }}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  <option value="school">School</option>
                  <option value="diocese">Diocese</option>
                </select>
              </div>
              {formState.category === "school" ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    School
                  </label>
                  <select
                    value={formState.school}
                    onChange={(event) =>
                      updateField("school", event.target.value)
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="">Select a school</option>
                    <option value="st-marys">St. Mary&apos;s College</option>
                    <option value="st-josephs">St. Joseph&apos;s Seminary</option>
                    <option value="holy-cross">Holy Cross College</option>
                  </select>
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Role
                </label>
                <select
                  value={formState.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                  Status
                </label>
                <select
                  value={formState.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <p className="text-xs text-[#1b1b18]/60">
                Passwords are generated automatically after creation.
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
                  {submitState.loading ? "Creating..." : "Create User"}
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

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          confirmUser ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!confirmUser}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmUser(null)}
        />
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="border-b border-[#0f4c3a]/10 px-6 py-5">
            <p className="font-display text-2xl text-[#1b1b18]">
              {confirmUser?.action === "activate"
                ? `Activate ${confirmUser.name}?`
                : confirmUser
                ? `Deactivate ${confirmUser.name}?`
                : "Confirm action"}
            </p>
            <p className="mt-2 text-sm text-[#1b1b18]/70">
              {confirmUser?.action === "activate"
                ? `This will set ${confirmUser.name} to active and restore their sign-in access.`
                : confirmUser
                ? `This will set ${confirmUser.name} to inactive and will no longer be able to sign in.`
                : ""}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-6">
            <button
              type="button"
              className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              onClick={() => setConfirmUser(null)}
            >
              Cancel
            </button>
            {confirmUser?.action === "activate" ? (
              <button
                type="button"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:translate-y-[-1px]"
                onClick={async () => {
                  if (!confirmUser) {
                    return;
                  }
                  const id = confirmUser.id;
                  setConfirmUser(null);
                  await handleActivate(id);
                }}
              >
                Yes, Activate
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:translate-y-[-1px]"
                onClick={async () => {
                  if (!confirmUser) {
                    return;
                  }
                  const id = confirmUser.id;
                  setConfirmUser(null);
                  await handleDeactivate(id);
                }}
              >
                Yes, Deactivate
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          editUser ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!editUser}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditUser(null)}
        />
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Edit User</p>
              <p className="text-sm text-[#1b1b18]/70">
                Update user details and status.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close edit user"
              onClick={() => setEditUser(null)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>
          {editUser ? (
            <form className="space-y-6 px-6 py-6" onSubmit={handleUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={editUser.full_name ?? ""}
                    onChange={(event) =>
                      setEditUser((prev) =>
                        prev
                          ? { ...prev, full_name: event.target.value }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={editUser.account_id ?? ""}
                    readOnly
                    className="w-full rounded-2xl border border-[#0f4c3a]/10 bg-[#f1eadc] px-4 py-3 text-sm text-[#1b1b18]/70 shadow-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="user@school.edu.ng"
                    value={editUser.email}
                    onChange={(event) =>
                      setEditUser((prev) =>
                        prev ? { ...prev, email: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Category
                  </label>
                  <select
                    value={editUser.category}
                    onChange={(event) =>
                      setEditUser((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: event.target.value,
                              role:
                                event.target.value === "diocese"
                                  ? "admin"
                                  : "teacher",
                              school:
                                event.target.value === "diocese"
                                  ? ""
                                  : prev.school,
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="school">School</option>
                    <option value="diocese">Diocese</option>
                  </select>
                </div>
                {editUser.category === "school" ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                      School
                    </label>
                    <select
                      value={editUser.school ?? ""}
                      onChange={(event) =>
                        setEditUser((prev) =>
                          prev ? { ...prev, school: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                    >
                      <option value="">Select a school</option>
                      <option value="st-marys">St. Mary&apos;s College</option>
                      <option value="st-josephs">
                        St. Joseph&apos;s Seminary
                      </option>
                      <option value="holy-cross">Holy Cross College</option>
                    </select>
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Role
                  </label>
                  <select
                    value={editUser.role}
                    onChange={(event) =>
                      setEditUser((prev) =>
                        prev ? { ...prev, role: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    {editRoleOptions.map((option) => (
                      <option key={option} value={option.toLowerCase()}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Status
                  </label>
                  <select
                    value={editUser.status}
                    onChange={(event) =>
                      setEditUser((prev) =>
                        prev ? { ...prev, status: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
                <p className="text-xs text-[#1b1b18]/60">
                  Updates apply immediately to this account.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                    onClick={() => setEditUser(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={submitState.loading}
                  >
                    {submitState.loading ? "Updating..." : "Update User"}
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
