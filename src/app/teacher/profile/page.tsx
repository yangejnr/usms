"use client";

import { useEffect, useState } from "react";

type Profile = {
  phone: string;
  address: string;
  gender: string;
  date_of_birth: string;
  marital_status: string;
  photo_data_url: string;
};

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    phone: "",
    address: "",
    gender: "male",
    date_of_birth: "",
    marital_status: "single",
    photo_data_url: "",
  });
  const [hasProfile, setHasProfile] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitState, setSubmitState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/teacher/profile`);
        const data = await response.json();
        if (response.ok && data?.profile) {
          setProfile(data.profile);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        setHasProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState({ loading: true, error: null, success: null });

    try {
      const response = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitState({
          loading: false,
          error: data?.message ?? "Unable to save profile.",
          success: null,
        });
        return;
      }
      setSubmitState({
        loading: false,
        error: null,
        success: "Profile updated.",
      });
      setHasProfile(true);
      setEditOpen(false);
    } catch (error) {
      setSubmitState({
        loading: false,
        error: "Unable to reach the server.",
        success: null,
      });
    }
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        photo_data_url: String(reader.result ?? ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
          Teacher Profile
        </p>
        <h1 className="font-display text-3xl">Personal information</h1>
        <p className="mt-3 text-sm text-[#1b1b18]/70">
          Keep your biodata and contact information up to date.
        </p>
      </header>

      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[#0f4c3a]/10">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl border border-[#0f4c3a]/10 bg-[#f1eadc] text-sm text-[#1b1b18]/60">
              {profile.photo_data_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_data_url}
                  alt="Passport photograph"
                  className="h-full w-full object-cover"
                />
              ) : (
                "Passport Photo"
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Phone", value: profile.phone || "—" },
              { label: "Gender", value: profile.gender || "—" },
              {
                label: "Date of Birth",
                value: profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—",
              },
              {
                label: "Marital Status",
                value: profile.marital_status || "—",
              },
              { label: "Address", value: profile.address || "—", span: true },
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
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
          <p className="text-xs text-[#1b1b18]/60">
            Your profile is visible to diocesan administrators.
          </p>
          <button
            type="button"
            className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px]"
            onClick={() => setEditOpen(true)}
          >
            {hasProfile ? "Edit Profile" : "Complete Profile"}
          </button>
        </div>
        {submitState.success ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
            {submitState.success}
          </p>
        ) : null}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity ${
          editOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!editOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#0f4c3a]/10 px-6 py-5">
            <div>
              <p className="font-display text-2xl">Edit Profile</p>
              <p className="text-sm text-[#1b1b18]/70">
                Update your personal details and contact information.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1b1b18]/20 bg-white text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
              aria-label="Close edit profile"
              onClick={() => setEditOpen(false)}
            >
              <span className="text-lg">×</span>
            </button>
          </div>

          <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl border border-[#0f4c3a]/10 bg-[#f1eadc] text-sm text-[#1b1b18]/60">
                  {profile.photo_data_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photo_data_url}
                      alt="Passport photograph"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "Passport Photo"
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#0f4c3a]/20 bg-white px-4 py-2 text-xs font-semibold text-[#0f4c3a] transition hover:border-[#0f4c3a]/50 hover:bg-[#f1eadc]">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Gender
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(event) =>
                      setProfile((prev) => ({
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
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        date_of_birth: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Marital Status
                  </label>
                  <select
                    value={profile.marital_status}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        marital_status: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="separated">Separated</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0f4c3a]">
                    Address
                  </label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#0f4c3a]/20 bg-white px-4 py-3 text-sm text-[#1b1b18] shadow-sm outline-none transition focus:border-[#0f4c3a] focus:ring-2 focus:ring-[#0f4c3a]/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#0f4c3a]/10 pt-4">
              <p className="text-xs text-[#1b1b18]/60">
                Keep your information accurate for diocesan records.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[#1b1b18]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1b1b18] transition hover:border-[#0f4c3a]/50 hover:text-[#0f4c3a]"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0f4c3a] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#0f4c3a]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitState.loading}
                >
                  {submitState.loading ? "Saving..." : "Update Profile"}
                </button>
              </div>
            </div>
            {submitState.error ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {submitState.error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
