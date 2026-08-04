"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ActionResult = {
  success: boolean;
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

interface ServiceFormProps {
  action: (
    state: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;

  submitLabel: string;

  defaultValues?: {
    id?: string;
    name?: string;
    description?: string | null;
    durationMinutes?: number;
    price?: number;
    color?: string | null;
  };
}

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function ServiceForm({
  action,
  submitLabel,
  defaultValues,
}: ServiceFormProps) {
  const [state, formAction] =
    useActionState<ActionResult | null, FormData>(
      action,
      null,
    );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      {defaultValues?.id && (
        <input
          type="hidden"
          name="id"
          value={defaultValues.id}
          readOnly
        />
      )}

      <div className="space-y-2">
        <label
          htmlFor="name"
          className="text-sm font-medium"
        >
          Nombre
        </label>

        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
        />

        {state?.errors?.name?.[0] && (
          <p className="text-sm text-destructive">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium"
        >
          Descripción
        </label>

        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={
            defaultValues?.description ?? ""
          }
        />

        {state?.errors?.description?.[0] && (
          <p className="text-sm text-destructive">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="durationMinutes"
            className="text-sm font-medium"
          >
            Duración (min)
          </label>

          <Input
            id="durationMinutes"
            type="number"
            name="durationMinutes"
            min={5}
            step={5}
            required
            defaultValue={
              defaultValues?.durationMinutes ?? 30
            }
          />

          {state?.errors?.durationMinutes?.[0] && (
            <p className="text-sm text-destructive">
              {
                state.errors
                  .durationMinutes[0]
              }
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="price"
            className="text-sm font-medium"
          >
            Precio
          </label>

          <Input
            id="price"
            type="number"
            name="price"
            min={0}
            step="0.01"
            required
            defaultValue={
              defaultValues?.price ?? 0
            }
          />

          {state?.errors?.price?.[0] && (
            <p className="text-sm text-destructive">
              {state.errors.price[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="color"
          className="text-sm font-medium"
        >
          Color
        </label>

        <Input
          id="color"
          type="color"
          name="color"
          defaultValue={
            defaultValues?.color ??
            "#3b82f6"
          }
        />

        {state?.errors?.color?.[0] && (
          <p className="text-sm text-destructive">
            {state.errors.color[0]}
          </p>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <SubmitButton
        label={submitLabel}
      />
    </form>
  );
}