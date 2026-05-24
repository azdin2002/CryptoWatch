"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface LoginFormErrors {
  email?: string;
  password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (values: LoginFormValues): LoginFormErrors => {
    const nextErrors: LoginFormErrors = {};
    const trimmedEmail = values.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "L'email est requis.";
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = "Entrez un email valide.";
    }

    if (!values.password) {
      nextErrors.password = "Le mot de passe est requis.";
    }

    return nextErrors;
  };

  const submitLogin = async (): Promise<void> => {
    if (isSubmitting) {
      return;
    }

    const values: LoginFormValues = {
      email,
      password,
    };
    const validationErrors = validateForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Vérifiez les champs du formulaire.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (!result?.ok || result.error) {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }

      toast.success("Connexion réussie.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Impossible de se connecter pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitLogin();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_30rem),linear-gradient(180deg,#f8fafc,#f4f4f5)] px-4 py-12 text-zinc-950 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_28rem),linear-gradient(180deg,#05070c,#09090b)] dark:text-zinc-50">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white/95 p-7 shadow-2xl shadow-zinc-200/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/30 sm:p-8">
        <div className="mb-8">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <LogIn className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            CryptoWatch
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Connexion
          </h1>
        </div>

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-300"
              htmlFor="email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-600 dark:focus:ring-emerald-950"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-300"
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-emerald-600 dark:focus:ring-emerald-950"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            ) : null}
          </div>

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:from-zinc-400 disabled:to-zinc-500"
            disabled={isSubmitting}
            type="submit"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Pas encore de compte ?{" "}
          <Link
            className="font-medium text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
            href="/register"
          >
            S&apos;inscrire
          </Link>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
