"use client";

import { format } from "date-fns";
import { useState, useTransition } from "react";

import {
  createPublicAppointment,
  type PublicAppointmentFormValues,
} from "../actions";

import { ServiceDTO } from "@/types/appointment";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  service: ServiceDTO;
  slot: Date;
  onSuccess?: () => void;
}

export function BookingForm({
  service,
  slot,
  onSuccess,
}: Props) {
  const [pending, startTransition] =
    useTransition();

  const [error, setError] =
    useState<string | null>(null);

  const [fieldErrors, setFieldErrors] =
    useState<
      Record<string, string>
    >({});

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    setError(null);
    setFieldErrors({});

    const values: PublicAppointmentFormValues =
      {
        ownerName:
          String(
            formData.get(
              "ownerName"
            ) ?? ""
          ).trim(),

        phone:
          String(
            formData.get(
              "phone"
            ) ?? ""
          ).trim(),

        email:
          String(
            formData.get(
              "email"
            ) ?? ""
          ).trim(),

        petName:
          String(
            formData.get(
              "petName"
            ) ?? ""
          ).trim(),

        notes:
          String(
            formData.get(
              "notes"
            ) ?? ""
          ).trim(),

        serviceId:
          service.id,

        startAt:
          slot.toISOString(),
      };

    startTransition(
      async () => {
        const result =
          await createPublicAppointment(
            values
          );

        if (!result.success) {

          if (
            "errors" in result &&
            result.errors
          ) {
            const errors: Record<
              string,
              string
            > = {};

            for (const [
              field,
              messages,
            ] of Object.entries(
              result.errors
            )) {
              if (
                Array.isArray(
                  messages
                ) &&
                messages.length > 0
              ) {
                errors[field] =
                  String(
                    messages[0]
                  );
              }
            }

            setFieldErrors(
              errors
            );


            setError(
              "Revisa los datos marcados en el formulario."
            );

            return;
          }


          setError(
            result.message ??
              "No fue posible reservar la cita."
          );

          return;
        }

        onSuccess?.();
      }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-xl border bg-card p-6"
    >

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-pink-400">
          Completa tus datos
        </h2>

      </div>

      {/* ===================================================
          ERROR GENERAL
      =================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="space-y-4">
       
        {/* NOMBRE */}

        <div className="grid gap-2">
          <Label htmlFor="ownerName">
            Nombre del propietario
          </Label>

          <Input
            id="ownerName"
            name="ownerName"
            placeholder="Tu nombre"
            autoComplete="name"
            required
            aria-invalid={
              !!fieldErrors.ownerName
            }
          />

          {fieldErrors.ownerName && (
            <p className="text-sm text-destructive">
              {fieldErrors.ownerName}
            </p>
          )}
        </div>

        {/* TELÉFONO */}

        <div className="grid gap-2">
          <Label htmlFor="phone">
            Teléfono
          </Label>

          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="55 1234 5678"
            autoComplete="tel"
            required
            aria-invalid={
              !!fieldErrors.phone
            }
          />

          {fieldErrors.phone && (
            <p className="text-sm text-destructive">
              Ingresa un teléfono válido
              de al menos 10 caracteres.
            </p>
          )}
        </div>

        {/* EMAIL */}

        <div className="grid gap-2">
          <Label htmlFor="email">
            Correo electrónico (opcional)
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            aria-invalid={
              !!fieldErrors.email
            }
          />

          {fieldErrors.email && (
            <p className="text-sm text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* ===================================================
          DATOS DE LA MASCOTA
      =================================================== */}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-pink-400">
            Datos de la mascota
          </h3>

        </div>

        {/* MASCOTA */}

        <div className="grid gap-2">
          <Label htmlFor="petName">
            Nombre de la mascota
          </Label>

          <Input
            id="petName"
            name="petName"
            placeholder="Ej. Max"
            required
            aria-invalid={
              !!fieldErrors.petName
            }
          />

          {fieldErrors.petName && (
            <p className="text-sm text-destructive">
              {fieldErrors.petName}
            </p>
          )}
        </div>

        {/* NOTAS */}

        <div className="grid gap-2">
          <Label htmlFor="notes">
            Motivo de consulta
          </Label>

          <Textarea
            id="notes"
            name="notes"
            placeholder="Motivo de consulta o informacion adicional"
            rows={4}
            aria-invalid={
              !!fieldErrors.notes
            }
          />

          {fieldErrors.notes && (
            <p className="text-sm text-destructive">
              {fieldErrors.notes}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-pink-500 hover:bg-pink-200"
        disabled={pending}
      >
        {pending
          ? "Reservando..."
          : "Reservar cita"}
      </Button>
    </form>
  );
}