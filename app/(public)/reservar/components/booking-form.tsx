"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentStatus, Service } from "@prisma/client";
import { format } from "date-fns";
import { toast } from "sonner";

import { createAppointment } from "@/app/(dashboard)/citas/actions";

import {
  appointmentSchema,
  AppointmentFormValues,
} from "@/app/(dashboard)/citas/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  service: Service;
  slot: Date;
}

export function BookingForm({
  service,
  slot,
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
        notes: "",
        serviceId: service.id,
        date: format(
          slot,
          "yyyy-MM-dd"
        ),
        time: format(
          slot,
          "HH:mm"
        ),
        status:
          AppointmentStatus.PENDING,
      },
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
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
        "¡Tu cita fue reservada!"
      );

      reset({
        ownerName: "",
        phone: "",
        email: "",
        petName: "",
        notes: "",
        serviceId: service.id,
        date: format(
          slot,
          "yyyy-MM-dd"
        ),
        time: format(
          slot,
          "HH:mm"
        ),
        status:
          AppointmentStatus.PENDING,
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="mt-8 space-y-5 rounded-xl border p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">
          Completa tus datos
        </h2>

        <p className="text-sm text-muted-foreground">
          {format(
            slot,
            "dd/MM/yyyy HH:mm"
          )}{" "}
          · {service.name}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ownerName">
          Nombre
        </Label>

        <Input
          id="ownerName"
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
          Mascota
        </Label>

        <Input
          id="petName"
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