"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LoginFormProps {
  hasInitialAdmin: boolean;
}

export default function LoginForm({
  hasInitialAdmin,
}: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("[LoginForm] error:", error);

      setError(
        "No fue posible iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            RemiVet
          </h1>

          <p className="mt-2 text-muted-foreground">
            Inicia sesión para acceder al panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@remivet.com"
              autoComplete="email"
              required
              disabled={loading}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <p
              className="text-sm text-red-500"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>
        </form>

        {!hasInitialAdmin && (
          <div className="mt-6 border-t pt-6 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              ¿Es la primera instalación?
            </p>

            <Link
              href="/setup"
              className="text-sm font-medium underline underline-offset-4"
            >
              Configurar RemiVet
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}