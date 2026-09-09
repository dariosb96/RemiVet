import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarDays } from "lucide-react";

interface TodayAppointment {
  id: string;
  ownerName: string;
  petName: string;
  startAt: Date;
  service: {
    name: string;
  };
}

interface Props {
  appointments: TodayAppointment[];
  timezone: string;
}

export function TodayAppointments({
  appointments,
  timezone,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Citas de hoy
            </h2>

            <p className="text-xs text-muted-foreground">
              Agenda del día
            </p>
          </div>
        </div>

        <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
          {appointments.length}
        </span>
      </div>

      {/* Sin citas */}

      {appointments.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-sm font-medium">
            No hay citas programadas para hoy.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Las nuevas citas aparecerán aquí.
          </p>
        </div>
      )}

      {/* Citas */}

      {appointments.length > 0 && (
        <div className="divide-y">
          {appointments.map((appointment, index) => {
            const startAt = toZonedTime(
              appointment.startAt,
              timezone
            );

            return (
              <div
                key={appointment.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
              >
                {/* Número */}

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>

                {/* Hora */}

                <div className="w-14 shrink-0">
                  <p className="text-sm font-semibold">
                    {format(startAt, "HH:mm")}
                  </p>
                </div>

                {/* Mascota / cliente */}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {appointment.petName}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {appointment.ownerName}
                  </p>
                </div>

                {/* Servicio */}

                <div className="hidden min-w-0 sm:block sm:w-40">
                  <p className="truncate text-sm text-muted-foreground">
                    {appointment.service.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}