"use client";

import { format } from "date-fns";

import { Service } from "@prisma/client";

import { Button } from "@/components/ui/button";

interface Props {
  service: Service;
  slots: Date[];
}

export function CalendarPicker({
  service,
  slots,
}: Props) {
  return (
    <div className="space-y-8">

      <div>

        <h1 className="text-3xl font-bold">
          {service.name}
        </h1>

        <p className="text-muted-foreground">
          Selecciona un horario disponible.
        </p>

      </div>

      <div className="grid grid-cols-3 gap-3">

        {slots.map((slot) => (
          <Button
            key={slot.toISOString()}
            variant="outline"
          >
            {format(slot, "HH:mm")}
          </Button>
        ))}

      </div>

    </div>
  );
}