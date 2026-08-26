"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronDown, Clock3 } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        Consultando horarios disponibles...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <p className="font-medium">
          No hay horarios disponibles.
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona otro día para continuar.
        </p>
      </div>
    );
  }

  function handleSelect(slot: string) {
    onSelect(slot);
    setOpen(false);
  }

  const selectedLabel = selectedSlot
    ? format(
        new Date(selectedSlot),
        "HH:mm",
        {
          locale: es,
        }
      )
    : null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold">
          Horario
        </h2>

        <p className="text-sm text-muted-foreground">
          Selecciona la hora de tu cita.
        </p>
      </div>

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          className="h-11 w-full justify-between"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />

            {selectedLabel ?? "Selecciona una hora"}
          </span>

          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </Button>

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border bg-popover p-2 shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        handleSelect(slot)
                      }
                      className="w-full"
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
          </div>
        )}
      </div>

      {selectedSlot && (
        <p className="text-sm text-muted-foreground">
          Horario seleccionado:{" "}
          <span className="font-medium text-foreground">
            {format(
              new Date(selectedSlot),
              "HH:mm"
            )}
          </span>
        </p>
      )}
    </div>
  );
}