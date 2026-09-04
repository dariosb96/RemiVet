"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { signIn } from "next-auth/react";

import {
  createInitialAdmin,
} from "./actions";

export default function SetupForm() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

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
      /*
       * =======================================================
       * CREAR CUENTA
       * =======================================================
       */

      const formData =
        new FormData(
          event.currentTarget
        );

      const result =
        await createInitialAdmin(
          formData
        );

      if (!result.success) {
        setError(result.message ?? "Ocurrió un error.");
        return;
      }

      /*
       * =======================================================
       * LOGIN AUTOMÁTICO
       * =======================================================
       *
       * La cuenta ya existe en PostgreSQL.
       *
       * Ahora usamos exactamente las mismas credenciales
       * que acaba de introducir el usuario para crear
       * la sesión de NextAuth.
       */

      const loginResult =
        await signIn(
          "credentials",
          {
            email,
            password,
            redirect: false,
          }
        );

      /*
       * =======================================================
       * COMPROBAR LOGIN
       * =======================================================
       */

      if (
        !loginResult ||
        loginResult.error
      ) {
        console.error(
          "[SetupForm] Login automático falló:",
          loginResult?.error
        );

        setError(
          "La cuenta fue creada, pero no fue posible iniciar sesión automáticamente. Puedes iniciar sesión manualmente."
        );

        return;
      }

      /*
       * =======================================================
       * CONFIGURACIÓN
       * =======================================================
       *
       * Ya tenemos:
       *
       * User      ✅
       * Settings  ✅
       * Sesión    ✅
       *
       * Por lo tanto vamos directamente a configuración.
       */

      router.replace(
        "/configuracion"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[SetupForm] error:",
        error
      );

      setError(
        "No fue posible crear el administrador."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium"
        >
          Nombre
        </label>

        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
          disabled={loading}
          className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

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
            setEmail(
              event.target.value
            )
          }
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
            setPassword(
              event.target.value
            )
          }
          autoComplete="new-password"
          minLength={8}
          required
          disabled={loading}
          className="w-full rounded-md border bg-background px-3 py-2 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres.
        </p>
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
          ? "Configurando RemiVet..."
          : "Crear administrador"}
      </button>
    </form>
  );
}