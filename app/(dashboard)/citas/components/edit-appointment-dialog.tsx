"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentStatus } from "@prisma/client";
import { toast } from "sonner";

import { updateAppointment } from "@/lib/appointments/actions";

import {
  appointmentSchema,
  AppointmentFormValues,
} from "../schema";

import {
  ServiceDTO,
  AppointmentDTO,
} from "@/types/appointment";

import { AppointmentForm } from "./appointment-form";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  appointment: AppointmentDTO;
  services: ServiceDTO[];
  children: React.ReactElement;
}

function getClinicDateTime(
  value: string,
  timezone: string
) {
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  const hour = parts.find(
    (part) => part.type === "hour"
  )?.value;

  const minute = parts.find(
    (part) => part.type === "minute"
  )?.value;

  if (
    !year ||
    !month ||
    !day ||
    !hour ||
    !minute
  ) {
    throw new Error(
      "No fue posible obtener la fecha y hora de la cita."
    );
  }

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

export function EditAppointmentDialog({
  appointment,
  services,
  children,
}: Props) {
  const router = useRouter();

  const [pending, startTransition] =
    useTransition();

  const [open, setOpen] =
    useState(false);

  const form =
    useForm<AppointmentFormValues>({
      resolver: zodResolver(
        appointmentSchema
      ),

      defaultValues: {
        ownerName:
          appointment.ownerName,

        phone:
          appointment.phone,

        email:
          appointment.email ?? "",

        petName:
          appointment.petName,

        serviceId:
          appointment.serviceId,

        date:
          getClinicDateTime(
            appointment.startAt,
            "America/Mexico_City"
          ).date,

        time:
          getClinicDateTime(
            appointment.startAt,
            "America/Mexico_City"
          ).time,

        notes:
          appointment.notes ?? "",

        status:
          appointment.status ??
          AppointmentStatus.PENDING,
      },

      mode: "onChange",
    });

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (nextOpen) {
      const clinicDateTime =
        getClinicDateTime(
          appointment.startAt,
          "America/Mexico_City"
        );

      form.reset({
        ownerName:
          appointment.ownerName,

        phone:
          appointment.phone,

        email:
          appointment.email ?? "",

        petName:
          appointment.petName,

        serviceId:
          appointment.serviceId,

        date:
          clinicDateTime.date,

        time:
          clinicDateTime.time,

        notes:
          appointment.notes ?? "",

        status:
          appointment.status ??
          AppointmentStatus.PENDING,
      });
    }
  }

  function onSubmit(
    values: AppointmentFormValues
  ) {
    startTransition(async () => {
      const originalDateTime =
        getClinicDateTime(
          appointment.startAt,
          "America/Mexico_City"
        );

      const valuesToUpdate: AppointmentFormValues =
        {
          ...values,

          date:
            values.date ||
            originalDateTime.date,

          time:
            values.time ||
            originalDateTime.time,
        };

      const result =
        await updateAppointment(
          appointment.id,
          valuesToUpdate
        );

      if (!result.success) {
        toast.error(
          result.message ??
            "No fue posible actualizar la cita."
        );

        return;
      }

      router.refresh();

      toast.success(
        "Cita actualizada correctamente."
      );

      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        render={children}
      />

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar cita
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="space-y-6"
        >
          <AppointmentForm
            form={form}
            services={services}
            excludeAppointmentId={
              appointment.id
            }
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending}
            >
              {pending
                ? "Guardando..."
                : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}