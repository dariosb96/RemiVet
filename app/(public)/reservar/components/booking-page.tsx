"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  BookingSettings,
  ServiceDTO,
} from "@/types/appointment";

import { getAvailableSlotsAction } from "../actions";

import { AvailableSlots } from "../[serviceId]/components/available-slots";
import { BookingForm } from "../[serviceId]/components/booking-form";

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

  function handleBookingSuccess() {
    setServiceId("");
    setSelectedDate("");
    setSlots([]);
    setSelectedSlot(null);
  }

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