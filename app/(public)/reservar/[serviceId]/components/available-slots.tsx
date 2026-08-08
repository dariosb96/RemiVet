"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";

interface Props {
  slots: string[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
  loading?: boolean;
}

export function AvailableSlots({
  slots,
  selectedSlot,
  onSelect,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">
          Consultando horarios disponibles...
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="font-medium">
          No hay horarios disponibles.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona otro día para continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">
          Horarios disponibles
        </h2>

        <p className="text-sm text-muted-foreground">
          Selecciona el horario que prefieras.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot === slot;

          return (
            <Button
              key={slot}
              type="button"
              variant={
                isSelected
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                onSelect(slot)
              }
            >
              {format(
                new Date(slot),
                "HH:mm",
                {
                  locale: es,
                }
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}