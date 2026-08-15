"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  BookingSettings,
  ServiceDTO,
} from "@/types/appointment";

import { getAvailableSlotsAction } from "../actions";

import { AvailableSlots } from "./available-slots";
import { BookingForm } from "./booking-form";

interface Props {
  services: ServiceDTO[];
  settings: BookingSettings | null;
}

export function BookingPage({
  services,
  settings,
}: Props) {
  const [serviceId, setServiceId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [slots, setSlots] =
    useState<string[]>([]);

  const [selectedSlot, setSelectedSlot] =
    useState<string | null>(null);

  const [loading, startTransition] =
    useTransition();

  const [bookingCompleted, setBookingCompleted] =
    useState(false);

  const selectedService =
    services.find(
      (service) =>
        service.id === serviceId
    ) ?? null;

  function handleServiceChange(
    value: string
  ) {
    setServiceId(value);
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot(null);
  }

  function handleDateChange(
    value: string
  ) {
    setSelectedDate(value);
    setSlots([]);
    setSelectedSlot(null);

    if (!value || !serviceId) {
      return;
    }

    if (!settings) {
      toast.error(
        "La agenda todavía no está configurada."
      );

      return;
    }

    startTransition(async () => {
      const result =
        await getAvailableSlotsAction({
          serviceId,
          date: value,
        });

      if (!result.success) {
        toast.error(
          result.message ??
            "No fue posible consultar los horarios."
        );

        return;
      }

      setSlots(result.slots);

      if (result.slots.length === 0) {
        toast.info(
          "No hay horarios disponibles para esta fecha."
        );
      }
    });
  }

  /*
   * Se ejecuta después de que
   * createPublicAppointment()
   * devuelve success: true.
   */
  function handleBookingSuccess() {
    setBookingCompleted(true);
  }

  /*
   * Reinicia completamente el flujo
   * para permitir otra reserva.
   */
  function handleNewBooking() {
    setBookingCompleted(false);
    setServiceId("");
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot(null);
  }

  /*
   * PANTALLA DE CONFIRMACIÓN
   */

if (bookingCompleted) {
  const confirmedService = services.find(
    (service) => service.id === serviceId
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">

        <div className="mb-5 text-5xl">
          🐾
        </div>

        <h1 className="text-2xl font-bold">
          ¡Cita agendada!
        </h1>

        <p className="mt-3 text-muted-foreground">
          Tu cita fue registrada correctamente.
        </p>

        {/* DETALLES DE LA CITA */}

        <div className="mt-6 rounded-xl border bg-muted/50 p-5 text-left">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Detalles de tu cita
          </h2>

          <div className="space-y-3">

            <div>
              <p className="text-xs text-muted-foreground">
                Servicio
              </p>

              <p className="font-medium">
                {confirmedService?.name ?? "Servicio"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Fecha
              </p>

              <p className="font-medium">
                {format(
                  new Date(
                    selectedSlot ?? ""
                  ),
                  "dd 'de' MMMM 'de' yyyy"
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Hora
              </p>

              <p className="font-medium">
                {format(
                  new Date(
                    selectedSlot ?? ""
                  ),
                  "HH:mm"
                )}
              </p>
            </div>

          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          Te esperamos en RemiVet con tu mascota.
        </p>

        <button
          type="button"
          onClick={handleNewBooking}
          className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Agendar otra cita
        </button>

      </div>
    </main>
  );
}

  /*
   * FORMULARIO DE RESERVA
   */

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Reserva tu cita
        </h1>

        <p className="mt-2 text-muted-foreground">
          Completa los datos para agendar la cita de tu mascota.
        </p>
      </div>

      <div className="space-y-6">

        {/* SERVICIO */}

        <div className="grid gap-2">
          <label
            htmlFor="service"
            className="text-sm font-medium"
          >
            Servicio
          </label>

          <select
            id="service"
            value={serviceId}
            onChange={(event) =>
              handleServiceChange(
                event.target.value
              )
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">
              Selecciona un servicio
            </option>

            {services.map((service) => (
              <option
                key={service.id}
                value={service.id}
              >
                {service.name} ·{" "}
                {service.durationMinutes} min · $
                {service.price.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* FECHA */}

        {selectedService && (
          <div className="grid gap-2">

            <label
              htmlFor="date"
              className="text-sm font-medium"
            >
              Fecha
            </label>

            <input
              id="date"
              type="date"
              value={selectedDate}
              min={format(
                new Date(),
                "yyyy-MM-dd"
              )}
              onChange={(event) =>
                handleDateChange(
                  event.target.value
                )
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />

          </div>
        )}

        {/* HORARIOS */}

        {selectedDate && (
          <AvailableSlots
            slots={slots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            loading={loading}
          />
        )}

        {/* FORMULARIO */}

        {selectedService &&
          selectedSlot && (
            <BookingForm
              service={selectedService}
              slot={
                new Date(selectedSlot)
              }
              onSuccess={
                handleBookingSuccess
              }
            />
          )}

      </div>
    </main>
  );
}