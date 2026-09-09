import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { TodayAppointments } from "./components/today-appointments";

export const dynamic = "force-dynamic";

const TIMEZONE = "America/Mexico_City";

export default async function DashboardPage() {
  const now = new Date();

  const clinicNow = toZonedTime(now, TIMEZONE);

  const startOfDay = new Date(clinicNow);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(clinicNow);
  endOfDay.setHours(23, 59, 59, 999);

  const dayStart = fromZonedTime(
    startOfDay,
    TIMEZONE
  );

  const dayEnd = fromZonedTime(
    endOfDay,
    TIMEZONE
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: {
        gte: dayStart,
        lte: dayEnd,
      },

      status: {
        not: "CANCELLED",
      },
    },

    include: {
      service: true,
    },

    orderBy: {
      startAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Resumen de las citas de hoy.
        </p>
      </div>

      <TodayAppointments
        appointments={appointments}
        timezone={TIMEZONE}
      />
    </div>
  );
}