"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ServiceFormState = {
  success: boolean;
  errors?: {
    name?: string[];
    durationMinutes?: string[];
    price?: string[];
    description?: string[];
    color?: string[];
  };
  message?: string;
};

interface ServiceFormProps {
  action: (
    prevState: ServiceFormState | undefined,
    formData: FormData
  ) => Promise<ServiceFormState>;

  defaultValues?: {
    id?: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: string;
    color: string | null;
  };

  submitLabel?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function ServiceForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: ServiceFormProps) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues?.id && (
        <input type="hidden" name="id" defaultValue={defaultValues.id} />
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input
          name="name"
          required
          placeholder="Consulta General"
          defaultValue={defaultValues?.name}
        />
        {state?.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          name="description"
          rows={3}
          placeholder="Descripción del servicio..."
          defaultValue={defaultValues?.description ?? ""}
        />
        {state?.errors?.description && (
          <p className="text-sm text-red-500">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Duración (min)</label>
          <Input
            type="number"
            name="durationMinutes"
            min={5}
            step={5}
            required
            defaultValue={defaultValues?.durationMinutes ?? 30}
          />
          {state?.errors?.durationMinutes && (
            <p className="text-sm text-red-500">
              {state.errors.durationMinutes[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Precio</label>
          <Input
            type="number"
            name="price"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price ?? "0"}
          />
          {state?.errors?.price && (
            <p className="text-sm text-red-500">{state.errors.price[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Color</label>
        <Input
          type="color"
          name="color"
          defaultValue={defaultValues?.color ?? "#3b82f6"}
        />
      </div>

      {state?.message && !state.success && (
        <p className="text-sm text-red-500">{state.message}</p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}