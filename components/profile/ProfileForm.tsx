"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Lock, Mail, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getToastErrorMessage } from "@/lib/toasts";
import type { ApiResponse, ProfileRecord } from "@/types";

interface ProfileFormProps {
  initialProfile: ProfileRecord;
}

interface ProfileFormState {
  name: string;
  email: string;
  password: string;
}

const MIN_PASSWORD_LENGTH = 8;

const getInitials = (name: string, email: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || email[0]?.toUpperCase() || "U";
};

const readApiResponse = async <T,>(response: Response): Promise<T> => {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error ?? "Unable to process profile.");
  }

  return payload.data;
};

export const ProfileForm = ({ initialProfile }: ProfileFormProps) => {
  const router = useRouter();
  const [formState, setFormState] = useState<ProfileFormState>({
    name: initialProfile.name,
    email: initialProfile.email,
    password: "",
  });
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initials = useMemo(
    () => getInitials(formState.name, formState.email),
    [formState.name, formState.email],
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (): Promise<void> => {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });
        const profile = await readApiResponse<ProfileRecord>(response);

        if (!mounted) {
          return;
        }

        setFormState((current) => ({
          ...current,
          name: profile.name,
          email: profile.email,
        }));
        setError(null);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        const message = getToastErrorMessage(
          loadError,
          "Unable to load your profile.",
        );
        setError(message);
        toast.error(message, { id: "profile-load-error" });
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof ProfileFormState, value: string): void => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const name = formState.name.trim();

    if (!name) {
      setError("Name cannot be empty.");
      toast.error("Name cannot be empty.");
      return;
    }

    if (
      formState.password.length > 0 &&
      formState.password.length < MIN_PASSWORD_LENGTH
    ) {
      const message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      setError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password: formState.password || undefined,
        }),
      });
      const profile = await readApiResponse<ProfileRecord>(response);

      setFormState({
        name: profile.name,
        email: profile.email,
        password: "",
      });
      setSuccess("Profile updated successfully.");
      toast.success("Profile updated.");
      router.refresh();
    } catch (updateError) {
      const message = getToastErrorMessage(
        updateError,
        "Unable to update profile.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/25">
      <div className="grid gap-0 lg:grid-cols-[20rem_1fr]">
        <aside className="border-b border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-950/40 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-2xl font-semibold text-white shadow-lg shadow-emerald-500/20">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                {formState.name || "User"}
              </h2>
              <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                {formState.email}
              </p>
              {loadingProfile ? (
                <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Refreshing profile...
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="grid gap-5">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Name
              </label>
              <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 shadow-sm transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-emerald-600 dark:focus-within:ring-emerald-950">
                <UserRound
                  className="h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  id="profile-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  autoComplete="name"
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-100 px-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
                <Mail
                  className="h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  id="profile-email"
                  type="email"
                  value={formState.email}
                  readOnly
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-600 outline-none dark:text-zinc-300"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                New password
              </label>
              <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 shadow-sm transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-emerald-600 dark:focus-within:ring-emerald-950">
                <Lock
                  className="h-4 w-4 shrink-0 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  id="profile-password"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current password"
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Use at least {MIN_PASSWORD_LENGTH} characters when changing it.
              </p>
            </div>

            <div aria-live="polite" className="min-h-5">
              {error ? (
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {success}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                disabled={submitting || loadingProfile}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {submitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProfileForm;
