"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentStatus } from "@prisma/client";
import { toast } from "sonner";

import { createAppointment } from "../actions";

import {
  appointmentSchema,
  type AppointmentFormValues,
} from "../schema";

import type { ServiceDTO } from "@/types/appointment";

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
  children: ReactElement;
  services: ServiceDTO[];
}

const defaultValues: AppointmentFormValues = {
  ownerName: "",
  phone: "",
  email: "",
  petName: "",
  serviceId: "",
  date: "",
  time: "",
  notes: "",
  status: AppointmentStatus.PENDING,
};

export function CreateAppointmentDialog({
  services,
  children,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues,
    mode: "onChange",
  });

  function handleOpenChange(
    nextOpen: boolean
  ) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setErrorMessage(null);
      form.reset(defaultValues);
    }
  }

  function onSubmit(
    values: AppointmentFormValues
  ) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result =
          await createAppointment(values);

        if (!result.success) {
          const message =
            result.message ??
            "No fue posible crear la cita.";

          setErrorMessage(message);
          toast.error(message);

          return;
        }

        /*
         * La cita ya fue creada correctamente
         * en PostgreSQL.
         *
         * Refrescamos los Server Components de
         * /citas para que AppointmentsTable reciba
         * nuevamente las citas actualizadas.
         */
        router.refresh();

        toast.success(
          result.message ??
            "Cita creada correctamente."
        );

        form.reset(defaultValues);
        setErrorMessage(null);
        setOpen(false);
      } catch (error) {
        console.error(
          "[CreateAppointmentDialog]",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "No fue posible crear la cita.";

        setErrorMessage(message);
        toast.error(message);
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
            Nueva cita
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <AppointmentForm
            form={form}
            services={services}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                handleOpenChange(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                pending ||
                services.length === 0 ||
                !form.formState.isValid
              }
            >
              {pending
                ? "Guardando..."
                : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}