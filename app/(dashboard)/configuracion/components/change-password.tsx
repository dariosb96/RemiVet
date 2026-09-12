"use client";

import {
  useState,
} from "react";

import {
  changePasswordAction,
} from "../actions";

import { Button } from "@/components/ui/button";

export function ChangePasswordSettings() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage(null);
    setError(null);

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setError(
        "Completa todos los campos."
      );

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "Las nuevas contraseñas no coinciden."
      );

      return;
    }

    setSaving(true);

    try {
      const result =
        await changePasswordAction(
          currentPassword,
          newPassword,
          confirmPassword
        );

      if (!result.success) {
        setError(
          result.message
        );

        return;
      }

      setMessage(
        result.message
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "[ChangePasswordSettings] error:",
        error
      );

      setError(
        "No fue posible cambiar la contraseña."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 rounded-lg border p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Cambiar contraseña
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Actualiza la contraseña de acceso a RemiVet.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label
            htmlFor="current-password"
            className="text-sm font-medium"
          >
            Contraseña actual
          </label>

          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="new-password"
            className="text-sm font-medium"
          >
            Nueva contraseña
          </label>

          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />

          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium"
          >
            Confirmar nueva contraseña
          </label>

          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Guardando..."
            : "Cambiar contraseña"}
        </Button>

        {message && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}