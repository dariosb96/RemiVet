"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  ServiceDTO,
  BookingSettings,
} from "@/types/appointment";

import { getAvailableSlotsAction } from "../actions";

import { AvailableSlots } from "./available-slots";
import { BookingForm } from "./booking-form";

interface Props {
  service: ServiceDTO;
  settings: BookingSettings;
}

export function BookingPage({
  service,
  settings,
}: Props) {
  const [selectedDate, setSelectedDate] =
    useState("");

  const [slots, setSlots] =
    useState<string[]>([]);

  const [selectedSlot, setSelectedSlot] =
    useState<string | null>(null);

  const [loading, startTransition] =
    useTransition();

  function handleDateChange(
    value: string
  ) {
    setSelectedDate(value);

    setSelectedSlot(null);
    setSlots([]);

    if (!value) {
      return;
    }

    startTransition(async () => {
      const result =
        await getAvailableSlotsAction({
          serviceId: service.id,
          date: value,
        });

      if (!result.success) {
        toast.error(
          "No fue posible consultar los horarios."
        );

        return;
      }

      setSlots(result.slots);
    });
  }

  return (
    <div className="space-y-8">
      {/* Service information */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {service.name}
        </h1>

        {service.description && (
          <p className="text-muted-foreground">
            {service.description}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            Duración:{" "}
            {service.durationMinutes} minutos
          </span>

          <span>
            Precio: ${service.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Date selection */}
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">
            Selecciona una fecha
          </h2>

          <p className="text-sm text-muted-foreground">
            Elige el día en que deseas acudir.
          </p>
        </div>

        <input
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
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-auto"
        />
      </div>

      {/* Available slots */}
      {selectedDate && (
        <AvailableSlots
          slots={slots}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
          loading={loading}
        />
      )}

      {/* Booking form */}
      {selectedSlot && (
        <BookingForm
          service={service}
          slot={new Date(selectedSlot)}
          onSuccess={() => {
            setSelectedSlot(null);
            setSlots([]);
          }}
        />
      )}
    </div>
  );
}