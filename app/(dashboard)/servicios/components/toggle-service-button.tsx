"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

import {
  toggleService,
} from "../actions";

import { Button } from "@/components/ui/button";

interface ToggleServiceButtonProps {
  id: string;
  active: boolean;
}

export function ToggleServiceButton({
  id,
  active,
}: ToggleServiceButtonProps) {
  const [pending, startTransition] =
    useTransition();

  const [error, setError] =
    useState("");

  function handleToggle() {
    if (pending) {
      return;
    }

    setError("");

    startTransition(async () => {
      const result =
        await toggleService(
          id,
          !active,
        );

      if (!result.success) {
        setError(
          result.message ??
            "No fue posible actualizar el servicio.",
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleToggle}
      >
        {active ? (
          <>
            <XCircle className="mr-2 size-4" />
            Desactivar
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            Activar
          </>
        )}
      </Button>

      {error && (
        <span className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}