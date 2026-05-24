"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            CryptoWatch
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            Connexion
          </h1>
        </div>

        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit}
        >
          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800"
              htmlFor="email"
            >
              Email
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800"
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            ) : null}
          </div>

          <button
            className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Pas encore de compte ?{" "}
          <Link
            className="font-medium text-emerald-700 hover:text-emerald-800"
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
