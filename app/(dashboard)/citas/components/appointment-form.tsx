"use client";

import { useEffect, useState } from "react";

import {
  Controller,
  type UseFormReturn,
  useWatch,
} from "react-hook-form";

import { AppointmentStatus } from "@prisma/client";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getAvailableSlotsAction } from "../actions";

import type { AppointmentFormValues } from "../schema";
import type { ServiceDTO } from "@/types/appointment";

interface Props {
  form: UseFormReturn<AppointmentFormValues>;
  services: ServiceDTO[];
  excludeAppointmentId?: string;
  showStatus?: boolean;
}

function formatSlotTime(slot: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(slot));
}

export function AppointmentForm({
  form,
  services,
  excludeAppointmentId,
  showStatus = true,
}: Props) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;

  const serviceId = useWatch({
    control,
    name: "serviceId",
  });

  const date = useWatch({
    control,
    name: "date",
  });

  const time = useWatch({
    control,
    name: "time",
  });

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      if (!serviceId || !date) {
        setSlots([]);
        setSlotsError(null);

        setValue("time", "", {
          shouldValidate: true,
        });

        return;
      }

      setLoadingSlots(true);
      setSlotsError(null);

      setValue("time", "", {
        shouldValidate: true,
      });

      try {
        const result = await getAvailableSlotsAction({
          serviceId,
          date,
          excludeAppointmentId,
        });

        if (cancelled) {
          return;
        }

        if (!result.success) {
          setSlots([]);
          setValue("time", "", {
            shouldValidate: true,
          });

          setSlotsError(
            result.message ??
              "No fue posible cargar los horarios disponibles."
          );

          return;
        }

        setSlots(result.slots);

        if (result.slots.length === 0) {
          setValue("time", "", {
            shouldValidate: true,
          });

          setSlotsError(
            "No hay horarios disponibles para esta fecha."
          );
        } else {
          setSlotsError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "[AppointmentForm] Error loading slots:",
          error
        );

        setSlots([]);
        setValue("time", "", {
          shouldValidate: true,
        });

        setSlotsError(
          "No fue posible cargar los horarios disponibles."
        );
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      cancelled = true;
    };
  }, [
    serviceId,
    date,
    excludeAppointmentId,
    setValue,
  ]);

  return (
    <div className="space-y-6">
      {/* PROPIETARIO / TELÉFONO */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerName">
            Nombre del propietario
          </Label>

          <Input
            id="ownerName"
            {...register("ownerName")}
            placeholder="Nombre completo"
          />

          {errors.ownerName && (
            <p className="text-sm text-destructive">
              {errors.ownerName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Teléfono
          </Label>

          <Input
            id="phone"
            {...register("phone")}
            placeholder="55 1234 5678"
          />

          {errors.phone && (
            <p className="text-sm text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      {/* EMAIL / MASCOTA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email
          </Label>

          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="cliente@email.com"
          />

          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="petName">
            Nombre de la mascota
          </Label>

          <Input
            id="petName"
            {...register("petName")}
            placeholder="Nombre de la mascota"
          />

          {errors.petName && (
            <p className="text-sm text-destructive">
              {errors.petName.message}
            </p>
          )}
        </div>
      </div>

      {/* SERVICIO */}
      <div className="space-y-2">
        <Label htmlFor="serviceId">
          Servicio
        </Label>

        <select
          id="serviceId"
          value={serviceId ?? ""}
          onChange={(event) => {
            const value = event.target.value;

            setValue("serviceId", value, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });

            setValue("time", "", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <option value="">
            Selecciona un servicio
          </option>

          {services.map((service) => (
            <option
              key={service.id}
              value={service.id}
            >
              {service.name}
            </option>
          ))}
        </select>

        {errors.serviceId && (
          <p className="text-sm text-destructive">
            {errors.serviceId.message}
          </p>
        )}
      </div>

      {/* FECHA / HORARIO */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="time">
            Horario disponible
          </Label>

          <select
            id="time"
            value={time ?? ""}
            disabled={
              !serviceId ||
              !date ||
              loadingSlots ||
              slots.length === 0
            }
            onChange={(event) => {
              const value = event.target.value;

              setValue("time", value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {loadingSlots
                ? "Cargando horarios..."
                : !serviceId
                  ? "Selecciona un servicio"
                  : !date
                    ? "Selecciona una fecha"
                    : slots.length === 0
                      ? "Sin horarios disponibles"
                      : "Selecciona un horario"}
            </option>

            {slots.map((slot) => {
              const time = formatSlotTime(slot);

              return (
                <option
                  key={slot}
                  value={time}
                >
                  {time}
                </option>
              );
            })}
          </select>

          {loadingSlots && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando horarios disponibles...
            </div>
          )}

          {!loadingSlots &&
            slotsError &&
            serviceId &&
            date && (
              <p className="text-sm text-muted-foreground">
                {slotsError}
              </p>
            )}

          {errors.time && (
            <p className="text-sm text-destructive">
              {errors.time.message}
            </p>
          )}
        </div>
      </div>

      {/* ESTADO */}
      {showStatus && (
        <div className="space-y-2">
          <Label>
            Estado
          </Label>

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    value={AppointmentStatus.PENDING}
                  >
                    Pendiente
                  </SelectItem>

                  <SelectItem
                    value={AppointmentStatus.CONFIRMED}
                  >
                    Confirmada
                  </SelectItem>

                  <SelectItem
                    value={AppointmentStatus.COMPLETED}
                  >
                    Completada
                  </SelectItem>

                  <SelectItem
                    value={AppointmentStatus.CANCELLED}
                  >
                    Cancelada
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          {errors.status && (
            <p className="text-sm text-destructive">
              {errors.status.message}
            </p>
          )}
        </div>
      )}

      {/* NOTAS */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          Notas
        </Label>

        <textarea
          id="notes"
          {...register("notes")}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          placeholder="Notas adicionales..."
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