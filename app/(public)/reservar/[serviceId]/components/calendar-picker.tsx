"use client";

import { format } from "date-fns";

import { Button } from "@/components/ui/button";

interface Props {
  slots: Date[];
  selectedSlot: Date | null;
  onSelect: (slot: Date) => void;
}

export function CalendarPicker({
  slots,
  selectedSlot,
  onSelect,
}: Props) {
  if (slots.length === 0) {
    return (
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        No hay horarios disponibles
        para esta fecha.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => {
        const selected =
          selectedSlot?.getTime() ===
          slot.getTime();

        return (
          <Button
            key={slot.toISOString()}
            type="button"
            variant={
              selected
                ? "default"
                : "outline"
            }
            onClick={() =>
              onSelect(slot)
            }
          >
            {format(slot, "HH:mm")}
          </Button>
        );
      })}
    </div>
  );
}