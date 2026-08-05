"use client";

import {
  Controller,
  UseFormReturn,
} from "react-hook-form";

import { Service } from "@prisma/client";

import { AppointmentFormValues } from "../schema";

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

interface AppointmentFormProps {
  form: UseFormReturn<AppointmentFormValues>;
  services: Service[];
  showStatus?: boolean;
}

export function AppointmentForm({
  form,
  services,
  showStatus = true,
}: AppointmentFormProps) {
  const {
    register,
    control,
    formState: {
      errors,
    },
  } = form;

  return (
    <div className="grid gap-4">

      <div className="grid gap-2">
        <Label htmlFor="ownerName">
          Propietario
        </Label>

        <Input
          id="ownerName"
          {...register("ownerName")}
        />

        {errors.ownerName && (
          <p className="text-sm text-destructive">
            {errors.ownerName.message}
          </p>
        )}
      </div>


      <div className="grid gap-2">
        <Label htmlFor="phone">
          Teléfono
        </Label>

        <Input
          id="phone"
          {...register("phone")}
        />

        {errors.phone && (
          <p className="text-sm text-destructive">
            {errors.phone.message}
          </p>
        )}
      </div>


      <div className="grid gap-2">
        <Label htmlFor="email">
          Email
        </Label>

        <Input
          id="email"
          type="email"
          {...register("email")}
        />

        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>


      <div className="grid gap-2">
        <Label htmlFor="petName">
          Mascota
        </Label>

        <Input
          id="petName"
          {...register("petName")}
        />

        {errors.petName && (
          <p className="text-sm text-destructive">
            {errors.petName.message}
          </p>
        )}
      </div>


      <div className="grid gap-2">
        <Label>
          Servicio
        </Label>

        <Controller
          control={control}
          name="serviceId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona servicio" />
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
          )}
        />

        {errors.serviceId && (
          <p className="text-sm text-destructive">
            {errors.serviceId.message}
          </p>
        )}
      </div>


      <div className="grid grid-cols-2 gap-4">

        <div className="grid gap-2">
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


        <div className="grid gap-2">
          <Label htmlFor="time">
            Hora
          </Label>

          <Input
            id="time"
            type="time"
            {...register("time")}
          />

          {errors.time && (
            <p className="text-sm text-destructive">
              {errors.time.message}
            </p>
          )}
        </div>

      </div>


      {showStatus && (
        <div className="grid gap-2">
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
            )}
          />
        </div>
      )}


      <div className="grid gap-2">
        <Label htmlFor="notes">
          Notas
        </Label>

        <Textarea
          id="notes"
          {...register("notes")}
        />
      </div>

    </div>
  );
}