"use client";

import { Service, AppointmentStatus } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AppointmentFormValues } from "../types";

interface AppointmentFormProps {
  services: Service[];
  values: AppointmentFormValues;
  onChange: (
    values: AppointmentFormValues
  ) => void;
}

export function AppointmentForm({
  services,
  values,
  onChange,
}: AppointmentFormProps) {
  function update<K extends keyof AppointmentFormValues>(
    key: K,
    value: AppointmentFormValues[K]
  ) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  return (
    <div className="grid gap-4">

      <div className="grid gap-2">
        <Label>Propietario</Label>

        <Input
          value={values.ownerName}
          onChange={(e) =>
            update("ownerName", e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label>Teléfono</Label>

        <Input
          value={values.phone}
          onChange={(e) =>
            update("phone", e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label>Email</Label>

        <Input
          type="email"
          value={values.email}
          onChange={(e) =>
            update("email", e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label>Mascota</Label>

        <Input
          value={values.petName}
          onChange={(e) =>
            update("petName", e.target.value)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label>Servicio</Label>

        <Select
          value={values.serviceId}
         onValueChange={(value) =>
  update("serviceId", value ?? "")
}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un servicio" />
          </SelectTrigger>

          <SelectContent>
            {services.map((service) => (
              <SelectItem
                key={service.id}
                value={service.id}
              >
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="grid gap-2">
          <Label>Fecha</Label>

          <Input
            type="date"
            value={values.date}
            onChange={(e) =>
              update("date", e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Hora</Label>

          <Input
            type="time"
            value={values.time}
            onChange={(e) =>
              update("time", e.target.value)
            }
          />
        </div>

      </div>

      <div className="grid gap-2">
        <Label>Estado</Label>

        <Select
          value={values.status}
          onValueChange={(value) =>
  update(
    "status",
    (value ?? "PENDING") as AppointmentStatus
  )
}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="PENDING">
              Pendiente
            </SelectItem>

            <SelectItem value="CONFIRMED">
              Confirmada
            </SelectItem>

            <SelectItem value="COMPLETED">
              Completada
            </SelectItem>

            <SelectItem value="CANCELLED">
              Cancelada
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Notas</Label>

        <Textarea
          value={values.notes}
          onChange={(e) =>
            update("notes", e.target.value)
          }
        />
      </div>

    </div>
  );
}