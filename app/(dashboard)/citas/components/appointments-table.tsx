"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";

import {
  ServiceDTO,
  AppointmentDTO,
} from "@/types/appointment";

import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
import { HardDeleteAppointmentDialog } from "./hard-delete-appointment-dialog";

interface Props {
  appointments: AppointmentDTO[];
  services: ServiceDTO[];
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pendiente";

    case "CONFIRMED":
      return "Confirmada";

    case "CANCELLED":
      return "Cancelada";

    case "COMPLETED":
      return "Completada";

    default:
      return status;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";

    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";

    case "CANCELLED":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";

    case "COMPLETED":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AppointmentsTable({
  appointments,
  services,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* =====================================================
          DESKTOP HEADER
          ===================================================== */}

      <div className="hidden grid-cols-[1.3fr_1fr_1.2fr_1.3fr_1fr_2fr] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
        <span>Cliente</span>

        <span>Mascota</span>

        <span>Servicio</span>

        <span>Fecha</span>

        <span>Estado</span>

        <span className="text-right">
          Acciones
        </span>
      </div>

      {/* =====================================================
          EMPTY STATE
          ===================================================== */}

      {appointments.length === 0 && (
        <div className="p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <span className="text-xl">
              📅
            </span>
          </div>

          <p className="text-sm font-medium">
            No hay citas registradas
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Las nuevas citas aparecerán aquí.
          </p>
        </div>
      )}

      {/* =====================================================
          APPOINTMENTS
          ===================================================== */}

      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="border-b transition-colors last:border-b-0 hover:bg-muted/20"
        >
          {/* =================================================
              DESKTOP
              ================================================== */}

          <div className="hidden min-h-[76px] grid-cols-[1.3fr_1fr_1.2fr_1.3fr_1fr_2fr] items-center gap-4 px-5 py-4 text-sm lg:grid">
            {/* Cliente */}

            <div className="min-w-0">
              <p className="truncate font-medium">
                {appointment.ownerName}
              </p>

              {appointment.phone && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {appointment.phone}
                </p>
              )}
            </div>

            {/* Mascota */}

            <div className="min-w-0">
              <p className="truncate">
                {appointment.petName}
              </p>
            </div>

            {/* Servicio */}

            <div className="min-w-0">
              <p className="truncate">
                {appointment.service.name}
              </p>
            </div>

            {/* Fecha */}

            <div className="min-w-0">
              <p className="whitespace-nowrap">
                {format(
                  new Date(
                    appointment.startAt
                  ),
                  "dd MMM yyyy",
                  {
                    locale: es,
                  }
                )}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {format(
                  new Date(
                    appointment.startAt
                  ),
                  "HH:mm",
                  {
                    locale: es,
                  }
                )}
              </p>
            </div>

            {/* Estado */}

            <div>
              <span
                className={`
                  inline-flex
                  rounded-full
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  ${getStatusClasses(
                    appointment.status
                  )}
                `}
              >
                {getStatusLabel(
                  appointment.status
                )}
              </span>
            </div>

            {/* =================================================
                ACCIONES DESKTOP
                ================================================== */}

            <div className="flex justify-end gap-2">
              <EditAppointmentDialog
                appointment={appointment}
                services={services}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/30 dark:hover:bg-sky-950/60"
                >
                  Editar
                </Button>
              </EditAppointmentDialog>

         
              <HardDeleteAppointmentDialog
                id={appointment.id}
              />
            </div>
          </div>

          {/* =================================================
              MOBILE / TABLET
              ================================================== */}

          <div className="space-y-4 p-4 lg:hidden">
            {/* Información principal */}

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {appointment.ownerName}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  🐾 {appointment.petName}
                </p>
              </div>

              <span
                className={`
                  shrink-0
                  rounded-full
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  ${getStatusClasses(
                    appointment.status
                  )}
                `}
              >
                {getStatusLabel(
                  appointment.status
                )}
              </span>
            </div>

            {/* Detalles */}

            <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/30 p-3 sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Servicio
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {appointment.service.name}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Fecha
                </p>

                <p className="mt-1 text-sm font-medium">
                  {format(
                    new Date(
                      appointment.startAt
                    ),
                    "dd MMM yyyy",
                    {
                      locale: es,
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Hora
                </p>

                <p className="mt-1 text-sm font-medium">
                  {format(
                    new Date(
                      appointment.startAt
                    ),
                    "HH:mm",
                    {
                      locale: es,
                    }
                  )}
                </p>
              </div>
            </div>

            {/* =================================================
                ACCIONES MOBILE
                ================================================== */}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <EditAppointmentDialog
                appointment={appointment}
                services={services}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/30 dark:hover:bg-sky-950/60"
                >
                  Editar
                </Button>
              </EditAppointmentDialog>

              {/* El dialog genera su propio botón */}

              <HardDeleteAppointmentDialog
                id={appointment.id}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}