"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentStatus } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

import { createAppointment } from "@/app/(dashboard)/citas/actions";

import {
  appointmentSchema,
  AppointmentFormValues,
} from "@/app/(dashboard)/citas/schema";

import {
  ServiceDTO,

} from "@/types/appointment"
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

  const form =
    useForm<AppointmentFormValues>({
      resolver: zodResolver(
        appointmentSchema
      ),

      defaultValues: {
        ownerName: "",
        phone: "",
        email: "",
        petName: "",
        serviceId: service.id,

        date: format(
          slot,
          "yyyy-MM-dd"
        ),

        time: format(
          slot,
          "HH:mm"
        ),

        notes: "",

        status:
          AppointmentStatus.PENDING,
      },

      mode: "onChange",
    });

  const {
    register,
    handleSubmit,
    formState: {
      errors,
    },
    reset,
  } = form;

  function onSubmit(
    values: AppointmentFormValues
  ) {
    startTransition(async () => {
      const result =
        await createAppointment(values);

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

      reset();

      onSuccess?.();
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold">
          Completa tus datos
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {service.name} ·{" "}
          {format(
            slot,
            "dd/MM/yyyy HH:mm"
          )}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ownerName">
          Nombre
        </Label>

        <Input
          id="ownerName"
          placeholder="Tu nombre"
          {...register("ownerName")}
        />

        {errors.ownerName && (
          <p className="text-sm text-destructive">
            {errors.ownerName.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">
          Teléfono
        </Label>

        <Input
          id="phone"
          type="tel"
          placeholder="55 1234 5678"
          {...register("phone")}
        />

        {errors.phone && (
          <p className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">
          Correo electrónico
        </Label>

        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register("email")}
        />

        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="petName">
          Nombre de la mascota
        </Label>

        <Input
          id="petName"
          placeholder="Nombre de tu mascota"
          {...register("petName")}
        />

        {errors.petName && (
          <p className="text-sm text-destructive">
            {errors.petName.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">
          Notas
        </Label>

        <Textarea
          id="notes"
          placeholder="Información adicional..."
          {...register("notes")}
        />
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