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
  type AppointmentFormValues,
} from "../schema";

import type {
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

const TIMEZONE = "America/Mexico_City";

function getClinicDateTime(
  value: string,
  timezone: string
) {
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

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

function getAppointmentFormValues(
  appointment: AppointmentDTO
): AppointmentFormValues {
  const clinicDateTime = getClinicDateTime(
    appointment.startAt,
    TIMEZONE
  );

  return {
    ownerName: appointment.ownerName,
    phone: appointment.phone,
    email: appointment.email ?? "",
    petName: appointment.petName,

    serviceId: appointment.serviceId,

    date: clinicDateTime.date,
    time: clinicDateTime.time,

    notes: appointment.notes ?? "",

    status:
      appointment.status ??
      AppointmentStatus.PENDING,
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

  const [open, setOpen] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(
      appointmentSchema
    ),

    defaultValues:
      getAppointmentFormValues(appointment),

    mode: "onChange",
  });

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (nextOpen) {
      /*
       * Cada vez que abrimos el diálogo volvemos a
       * cargar TODOS los datos actuales de la cita.
       *
       * Esto garantiza que la hora actual también
       * aparezca en el formulario.
       */
      form.reset(
        getAppointmentFormValues(
          appointment
        )
      );
    }
  }

  function onSubmit(
    values: AppointmentFormValues
  ) {
    startTransition(async () => {
      try {
        /*
         * Si por cualquier motivo el campo de hora
         * llegara vacío, conservamos la hora original.
         *
         * Esto funciona como protección adicional,
         * pero el formulario ya debe traer la hora
         * correctamente cargada.
         */
        const originalDateTime =
          getClinicDateTime(
            appointment.startAt,
            TIMEZONE
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
      } catch (error) {
        console.error(
          "[EditAppointmentDialog]",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "No fue posible actualizar la cita."
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger render={children} />

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
            showStatus={true}
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
