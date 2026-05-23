"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface RegisterFormErrors {
  nom?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

interface RegisterErrorResponse {
  message?: string;
  error?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;

const isRegisterErrorResponse = (
  value: unknown,
): value is RegisterErrorResponse => {
  return typeof value === "object" && value !== null;
};

const getRegisterErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data: unknown = await response.json();

    if (!isRegisterErrorResponse(data)) {
      return "Impossible de créer le compte.";
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    return "Impossible de créer le compte.";
  } catch {
    return "Impossible de créer le compte.";
  }
};

const RegisterPage = () => {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): RegisterFormErrors => {
    const nextErrors: RegisterFormErrors = {};
    const trimmedNom = nom.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNom) {
      nextErrors.nom = "Le nom est requis.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "L'email est requis.";
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email = "Entrez un email valide.";
    }

    if (!password) {
      nextErrors.password = "Le mot de passe est requis.";
    } else if (password.length < minimumPasswordLength) {
      nextErrors.password =
        "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirmez le mot de passe.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword =
        "La confirmation ne correspond pas au mot de passe.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setErrors({
        form: await getRegisterErrorMessage(response),
      });
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-950">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            CryptoWatch
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            Inscription
          </h1>
        </div>

        {errors.form ? (
          <div
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errors.form}
          </div>
        ) : null}

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800"
              htmlFor="nom"
            >
              Nom
            </label>
            <input
              autoComplete="name"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="nom"
              name="nom"
              onChange={(event) => setNom(event.target.value)}
              type="text"
              value={nom}
            />
            {errors.nom ? (
              <p className="mt-2 text-sm text-red-600">{errors.nom}</p>
            ) : null}
          </div>

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
              autoComplete="new-password"
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

          <div>
            <label
              className="mb-2 block text-sm font-medium text-zinc-800"
              htmlFor="confirmPassword"
            >
              Confirmation mot de passe
            </label>
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="confirmPassword"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
            {errors.confirmPassword ? (
              <p className="mt-2 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          <button
            className="flex h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Création..." : "Créer le compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Déjà un compte ?{" "}
          <Link
            className="font-medium text-emerald-700 hover:text-emerald-800"
            href="/login"
          >
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
};

export default RegisterPage;
