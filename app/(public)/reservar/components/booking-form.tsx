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
    useState <string | null>(null);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);

    const values: PublicAppointmentFormValues = {
      ownerName: String(
        formData.get("ownerName") ?? ""
      ).trim(),

      phone: String(
        formData.get("phone") ?? ""
      ).trim(),

      email: String(
        formData.get("email") ?? ""
      ).trim(),

      petName: String(
        formData.get("petName") ?? ""
      ).trim(),

      notes: String(
        formData.get("notes") ?? ""
      ).trim(),

      serviceId: service.id,

      startAt: slot.toISOString(),
    };

    startTransition(async () => {
      const result =
        await createPublicAppointment(values);

      if (!result.success) {
        setError(
          result.message ??
            "No fue posible reservar la cita."
        );

        return;
      }

      /*
       * La reserva fue creada correctamente.
       *
       * BookingPage se encarga de mostrar
       * la pantalla de confirmación.
       */
      onSuccess?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-xl border bg-card p-6"
    >
      {/* RESUMEN */}

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          Completa tus datos
        </h2>

        <p className="text-sm text-muted-foreground">
          {service.name} ·{" "}
          {format(
            slot,
            "dd/MM/yyyy 'a las' HH:mm"
          )}
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* DATOS DEL CLIENTE */}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">
            Datos del cliente
          </h3>

          <p className="text-sm text-muted-foreground">
            Necesitamos estos datos para confirmar tu cita.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ownerName">
            Nombre
          </Label>

          <Input
            id="ownerName"
            name="ownerName"
            placeholder="Tu nombre"
            autoComplete="name"
            required
          />
        </div>

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
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">
            Correo electrónico
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </div>
      </div>

      {/* DATOS DE LA MASCOTA */}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">
            Datos de la mascota
          </h3>

          <p className="text-sm text-muted-foreground">
            Cuéntanos quién es el paciente.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="petName">
            Nombre de la mascota
          </Label>

          <Input
            id="petName"
            name="petName"
            placeholder="Ej. Max"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">
            Notas
          </Label>

          <Textarea
            id="notes"
            name="notes"
            placeholder="Información adicional sobre tu mascota o la cita..."
            rows={4}
          />
        </div>
      </div>

      {/* BOTÓN */}

      <Button
        type="submit"
        className="w-full"
        disabled={pending}
      >
        {pending
          ? "Reservando..."
          : "Reservar cita"}
      </Button>
    </form>
  );
}