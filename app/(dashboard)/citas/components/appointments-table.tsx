"use client";

import {
  AppointmentDTO,
  ServiceDTO,
} from "../types";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";

import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";

type AppointmentWithService =
  AppointmentDTO;

interface Props {
  appointments: AppointmentDTO[];
  services: ServiceDTO[];
}

export function AppointmentsTable({
  appointments,
  services,
}: Props) {

  return (
    <div className="rounded-lg border">

      <div className="grid grid-cols-6 gap-4 border-b p-4 text-sm font-medium">
        <span>Cliente</span>
        <span>Mascota</span>
        <span>Servicio</span>
        <span>Fecha</span>
        <span>Estado</span>
        <span />
      </div>


      {appointments.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No hay citas registradas.
        </div>
      )}


      {appointments.map(
        (appointment) => (

          <div
            key={appointment.id}
            className="grid grid-cols-6 items-center gap-4 border-b p-4 text-sm"
          >

            <span>
              {appointment.ownerName}
            </span>


            <span>
              {appointment.petName}
            </span>


            <span>
              {appointment.service.name}
            </span>


            <span>
              {format(
                appointment.startAt,
                "dd MMM yyyy HH:mm",
                {
                  locale: es,
                }
              )}
            </span>


            <span>
              {appointment.status}
            </span>


            <div className="flex justify-end gap-2">

              <EditAppointmentDialog
                appointment={appointment}
                services={services}
              >
                <Button
                  size="sm"
                  variant="outline"
                >
                  Editar
                </Button>
              </EditAppointmentDialog>


              <DeleteAppointmentDialog
                id={appointment.id}
              >
                <Button
                  size="sm"
                  variant="destructive"
                >
                  Eliminar
                </Button>
              </DeleteAppointmentDialog>

            </div>

          </div>

        )
      )}

    </div>
  );
}