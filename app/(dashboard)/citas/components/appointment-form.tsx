"use client";

import {
  UseFormReturn,
} from "react-hook-form";

import {
  AppointmentStatus,
} from "@prisma/client";

import {
  AppointmentFormValues,
} from "../schema";

import {
  ServiceDTO,
} from "@/types/appointment"

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

interface AppointmentFormProps {
  form: UseFormReturn<AppointmentFormValues>;
  services: ServiceDTO[];
  showStatus?: boolean;
}

export function AppointmentForm({
  form,
  services,
  showStatus = true,
}: AppointmentFormProps) {
  const {
    register,
    formState: {
      errors,
    },
  } = form;

  return (
    <div className="grid gap-4">

      {/* Propietario */}
      <div className="grid gap-2">
        <Label htmlFor="ownerName">
          Propietario
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

      {/* Teléfono */}
      <div className="grid gap-2">
        <Label htmlFor="phone">
          Teléfono
        </Label>

        <Input
          id="phone"
          type="tel"
          {...register("phone")}
        />

        {errors.phone && (
          <p className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="grid gap-2">
        <Label htmlFor="email">
          Email
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

      {/* Mascota */}
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

      {/* Servicio */}
      <div className="grid gap-2">
        <Label htmlFor="serviceId">
          Servicio
        </Label>

        <select
          id="serviceId"
          {...register("serviceId")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>
            Selecciona servicio
          </option>

          {services.length === 0 ? (
            <option value="" disabled>
              No hay servicios disponibles
            </option>
          ) : (
            services.map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.name}
              </option>
            ))
          )}
        </select>

        {errors.serviceId && (
          <p className="text-sm text-destructive">
            {errors.serviceId.message}
          </p>
        )}
      </div>

      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-4">

        <div className="grid gap-2">
          <Label htmlFor="date">
            Fecha
          </Label>

          <Input
            id="date"
            type="date"
            {...register("date")}
          />

          {errors.date && (
            <p className="text-sm text-destructive">
              {errors.date.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="time">
            Hora
          </Label>

          <Input
            id="time"
            type="time"
            {...register("time")}
          />

          {errors.time && (
            <p className="text-sm text-destructive">
              {errors.time.message}
            </p>
          )}
        </div>

      </div>

      {/* Estado */}
      {showStatus && (
        <div className="grid gap-2">

          <Label htmlFor="status">
            Estado
          </Label>

          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:ring-2 focus:ring-ring"
            defaultValue={
              AppointmentStatus.PENDING
            }
          >
            <option
              value={
                AppointmentStatus.PENDING
              }
            >
              Pendiente
            </option>

            <option
              value={
                AppointmentStatus.CONFIRMED
              }
            >
              Confirmada
            </option>

            <option
              value={
                AppointmentStatus.COMPLETED
              }
            >
              Completada
            </option>

            <option
              value={
                AppointmentStatus.CANCELLED
              }
            >
              Cancelada
            </option>
          </select>

          {errors.status && (
            <p className="text-sm text-destructive">
              {errors.status.message}
            </p>
          )}

        </div>
      )}

      {/* Notas */}
      <div className="grid gap-2">

        <Label htmlFor="notes">
          Notas
        </Label>

        <Textarea
          id="notes"
          {...register("notes")}
        />

        {errors.notes && (
          <p className="text-sm text-destructive">
            {errors.notes.message}
          </p>
        )}

      </div>

    </div>
  );
}
