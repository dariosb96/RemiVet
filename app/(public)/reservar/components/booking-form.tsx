"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createPublicAppointment,
  PublicAppointmentFormValues,
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

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form =
      new FormData(event.currentTarget);

    const values: PublicAppointmentFormValues =
      {
        ownerName:
          String(
            form.get("ownerName") ?? ""
          ),

        phone:
          String(
            form.get("phone") ?? ""
          ),

        email:
          String(
            form.get("email") ?? ""
          ),

        petName:
          String(
            form.get("petName") ?? ""
          ),

        notes:
          String(
            form.get("notes") ?? ""
          ),

        serviceId: service.id,

        startAt:
          slot.toISOString(),
      };

    startTransition(async () => {
      const result =
        await createPublicAppointment(
          values
        );

      if (!result.success) {
        toast.error(
          result.message ??
            "No fue posible reservar la cita."
        );

        return;
      }

      toast.success(
        "¡Tu cita fue reservada correctamente!"
      );

      event.currentTarget.reset();

      onSuccess?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border bg-card p-6"
    >
      {/* RESUMEN */}

      <div>
        <h2 className="text-lg font-semibold">
          Completa tus datos
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {service.name} ·{" "}
          {format(
            slot,
            "dd/MM/yyyy 'a las' HH:mm"
          )}
        </p>
      </div>

      {/* CLIENTE */}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">
            Datos del cliente
          </h3>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ownerName">
            Nombre
          </Label>

          <Input
            id="ownerName"
            name="ownerName"
            placeholder="Tu nombre"
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
          />
        </div>
      </div>

      {/* MASCOTA */}

      <div className="space-y-4">
        <div>
          <h3 className="font-medium">
            Datos de la mascota
          </h3>
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
            placeholder="Información adicional..."
          />
        </div>
      </div>

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