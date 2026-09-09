import { prisma } from "@/lib/prisma";
import type { AppointmentFormValues } from "@/app/(dashboard)/citas/schema";
import {
  buildZonedDate,
  getAvailableSlots,
} from "@/lib/appointments/availability";
import {
  getCalendarEvents,
  GoogleReauthRequiredError,
} from "@/lib/google/calendar";

export async function isSlotAvailable(
  startAt: Date,
  endAt: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
    where: {
      ...(excludeAppointmentId
        ? {
            id: {
              not: excludeAppointmentId,
            },
          }
        : {}),

      status: {
        not: "CANCELLED",
      },

      startAt: {
        lt: endAt,
      },

      endAt: {
        gt: startAt,
      },
    },

    select: {
      id: true,
    },
  });

  return !conflict;
}

function normalizeTime(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new Error("Fecha u hora inválida.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Fecha u hora inválida.");
  }

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

/**
 * Obtiene el siguiente día calendario sin depender
 * del timezone del servidor.
 *
 * Ejemplo:
 * 2026-09-09 -> 2026-09-10
 */
function getNextDateString(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  const nextDate = new Date(
    Date.UTC(year, month - 1, day + 1)
  );

  return [
    nextDate.getUTCFullYear(),
    String(nextDate.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export async function prepareAppointment(
  values: AppointmentFormValues,
  excludeAppointmentId?: string
) {
  const service = await prisma.service.findUnique({
    where: {
      id: values.serviceId,
    },

    select: {
      id: true,
      active: true,
      durationMinutes: true,
    },
  });

  const settings = await prisma.settings.findFirst({
    select: {
      openingTime: true,
      closingTime: true,
      slotIntervalMinutes: true,
      appointmentBufferMinutes: true,
      timezone: true,
      businessDays: true,
      googleRefreshToken: true,
      googleCalendarId: true,
    },
  });

  if (!service) {
    throw new Error("Servicio no encontrado.");
  }

  if (!service.active) {
    throw new Error(
      "El servicio seleccionado ya no está disponible."
    );
  }

  if (!settings) {
    throw new Error(
      "La configuración de la clínica no existe."
    );
  }

  /**
   * Google Calendar es obligatorio para determinar
   * la disponibilidad real.
   */
  if (
    !settings.googleRefreshToken ||
    !settings.googleCalendarId
  ) {
    throw new Error(
      "Google Calendar no está conectado. Conecta nuevamente Google Calendar antes de reservar."
    );
  }

  const timezone =
    settings.timezone || "America/Mexico_City";

  const time = normalizeTime(values.time);

  /**
   * Construimos el instante usando explícitamente
   * el timezone de la clínica.
   */
  const startAt = buildZonedDate(
    values.date,
    time,
    timezone
  );

  if (Number.isNaN(startAt.getTime())) {
    throw new Error("Fecha u hora inválida.");
  }

  if (startAt <= new Date()) {
    throw new Error("Ese horario ya pasó.");
  }

  const endAt = new Date(
    startAt.getTime() +
      service.durationMinutes * 60_000
  );

  /**
   * Inicio del día de la clínica.
   */
  const dayStart = buildZonedDate(
    values.date,
    "00:00",
    timezone
  );

  /**
   * Fin real del día:
   *
   * usamos la medianoche del día siguiente en lugar de
   * 23:59 para evitar problemas con segundos/milisegundos
   * y cambios de horario.
   */
  const nextDate = getNextDateString(values.date);

  const dayEnd = buildZonedDate(
    nextDate,
    "00:00",
    timezone
  );

  if (
    Number.isNaN(dayStart.getTime()) ||
    Number.isNaN(dayEnd.getTime())
  ) {
    throw new Error("Fecha inválida.");
  }

  /**
   * Si estamos editando una cita, obtenemos su Google Event ID
   * para no considerar su propio evento como bloqueo.
   */
  let excludedGoogleEventId: string | null = null;

  if (excludeAppointmentId) {
    const existingAppointment =
      await prisma.appointment.findUnique({
        where: {
          id: excludeAppointmentId,
        },
        select: {
          googleEventId: true,
        },
      });

    excludedGoogleEventId =
      existingAppointment?.googleEventId ?? null;
  }

  /**
   * Citas locales de PostgreSQL.
   */
  const appointments =
    await prisma.appointment.findMany({
      where: {
        ...(excludeAppointmentId
          ? {
              id: {
                not: excludeAppointmentId,
              },
            }
          : {}),

        status: {
          not: "CANCELLED",
        },

        startAt: {
          lt: dayEnd,
        },

        endAt: {
          gt: dayStart,
        },
      },
    });

  /**
   * Eventos de Google Calendar.
   *
   * Google es la fuente externa de verdad para los bloqueos.
   */
  let googleBlockedRanges;

  try {
    googleBlockedRanges = await getCalendarEvents({
      calendarId: settings.googleCalendarId,
      refreshToken: settings.googleRefreshToken,
      timeMin: dayStart,
      timeMax: dayEnd,
    });
  } catch (error) {
    /**
     * El refresh token fue revocado/expiró.
     *
     * No eliminamos citas de PostgreSQL.
     * Simplemente impedimos nuevas reservas hasta
     * que el administrador vuelva a conectar Google.
     */
    if (error instanceof GoogleReauthRequiredError) {
      await prisma.settings.updateMany({
        data: {
          googleRefreshToken: null,
          googleCalendarId: null,
        },
      });

      throw new Error(
        "GOOGLE_REAUTH_REQUIRED"
      );
    }

    /**
     * Si Google no responde correctamente por cualquier
     * otro motivo, no debemos asumir que el horario está libre.
     *
     * Esto evita crear citas sin comprobar el calendario.
     */
    console.error(
      "[prepareAppointment] Google Calendar error:",
      error
    );

    throw new Error(
      "No fue posible comprobar la disponibilidad de Google Calendar. Intenta nuevamente."
    );
  }

  /**
   * Cuando editamos una cita existente, su propio evento
   * de Google no debe bloquear su propio horario.
   */
  const externalBlockedRanges =
    googleBlockedRanges.filter(
      (range) =>
        !excludedGoogleEventId ||
        range.eventId !== excludedGoogleEventId
    );

  /**
   * MISMO motor que usa el frontend.
   *
   * Aquí se comprueban:
   *
   * 1. Horario laboral
   * 2. Días laborables
   * 3. Excepciones
   * 4. Buffer
   * 5. Citas PostgreSQL
   * 6. Eventos de Google Calendar
   */
  const availableSlots = getAvailableSlots({
    date: values.date,
    timezone,
    appointments,
    externalBlockedRanges,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    interval: settings.slotIntervalMinutes,
    duration: service.durationMinutes,
    buffer: settings.appointmentBufferMinutes,
    businessDays: settings.businessDays,
  });

  const requestedIsAvailable =
    availableSlots.some(
      (slot) =>
        slot.getTime() === startAt.getTime()
    );

  if (!requestedIsAvailable) {
    throw new Error(
      "Ese horario no está disponible. Selecciona uno de los horarios disponibles."
    );
  }

  /**
   * Segunda comprobación específica de solapamiento
   * contra PostgreSQL.
   *
   * Esto sigue siendo necesario porque la disponibilidad
   * mostrada al usuario puede quedar obsoleta mientras
   * otro usuario reserva.
   */
  const available = await isSlotAvailable(
    startAt,
    endAt,
    excludeAppointmentId
  );

  if (!available) {
    throw new Error(
      "Ya existe una cita en ese horario."
    );
  }

  return {
    ownerName: values.ownerName.trim(),
    phone: values.phone.trim(),
    email: values.email?.trim() || null,
    petName: values.petName.trim(),
    serviceId: service.id,
    startAt,
    endAt,
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}