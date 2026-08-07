"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import { format } from "date-fns";
import { Service } from "@prisma/client";

import { getAvailableSlotsAction } from "../actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  service: Service;
}

export function CalendarPicker({
  service,
}: Props) {
  const [pending, startTransition] =
    useTransition();

  const [date, setDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const [slots, setSlots] = useState<Date[]>(
    []
  );

  useEffect(() => {
    startTransition(async () => {
      const result =
        await getAvailableSlotsAction({
          serviceId: service.id,
          date,
        });

      setSlots(
        result.map(
          (slot) => new Date(slot)
        )
      );
    });
  }, [date, service.id]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {service.name}
        </h1>

        <p className="text-muted-foreground">
          Selecciona una fecha y un horario.
        </p>
      </div>

      <div className="max-w-xs space-y-2">
        <label className="text-sm font-medium">
          Fecha
        </label>

        <Input
          type="date"
          value={date}
          min={format(
            new Date(),
            "yyyy-MM-dd"
          )}
          onChange={(e) =>
            setDate(e.target.value)
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {pending ? (
          <p className="col-span-3 text-sm text-muted-foreground">
            Cargando horarios...
          </p>
        ) : slots.length === 0 ? (
          <p className="col-span-3 text-sm text-muted-foreground">
            No hay horarios disponibles.
          </p>
        ) : (
          slots.map((slot) => (
            <Button
              key={slot.toISOString()}
              variant="outline"
            >
              {format(slot, "HH:mm")}
            </Button>
          ))
        )}
      </div>
    </div>
  );
}