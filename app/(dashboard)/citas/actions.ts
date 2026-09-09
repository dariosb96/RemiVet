"use server";
import {
  getCalendarEvents,
  GoogleReauthRequiredError,
} from "@/lib/google/calendar";
import { fromZonedTime } from "date-fns-tz";

import { prisma } from "@/lib/prisma";

import {
  getAvailableSlots,
} from "@/lib/appointments/availability";

import {
  createAppointment as createAppointmentAction,
  updateAppointment as updateAppointmentAction,
  deleteAppointment as deleteAppointmentAction,
  hardDeleteAppointment as hardDeleteAppointmentAction,
} from "@/lib/appointments/actions";

/* =========================================================
   TYPES
========================================================= */

export interface AvailableSlotsResult {
  success: boolean;
  slots: string[];
  message?: string;
}

interface GetAvailableSlotsInput {
  serviceId: string;
  date: string;
  excludeAppointmentId?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function isValidDateString(
  value: string
): boolean {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T12:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getUTCFullYear() ===
      Number(value.slice(0, 4)) &&
    date.getUTCMonth() + 1 ===
      Number(value.slice(5, 7)) &&
    date.getUTCDate() ===
      Number(value.slice(8, 10))
  );
}

/* =========================================================
   CRUD
========================================================= */

export async function createAppointment(
  values: unknown
) {
  return createAppointmentAction(values);
}

export async function updateAppointment(
  id: string,
  values: unknown
) {
  return updateAppointmentAction(
    id,
    values
  );
}

export async function deleteAppointment(
  id: string
) {
  return deleteAppointmentAction(id);
}

export async function hardDeleteAppointment(
  id: string
) {
  return hardDeleteAppointmentAction(id);
}

/* =========================================================
   READ
========================================================= */

export async function getAppointments() {
  return prisma.appointment.findMany({
    include: {
      service: true,
    },

    orderBy: {
      startAt: "desc",
    },
  });
}

export async function getAppointment(
  id: string
) {
  if (!id) {
    return null;
  }

  return prisma.appointment.findUnique({
    where: {
      id,
    },

    include: {
      service: true,
    },
  });
}

/* =========================================================
   AVAILABILITY
========================================================= */

export async function getAvailableSlotsAction({
  serviceId,
  date,
  excludeAppointmentId,
}: GetAvailableSlotsInput): Promise<AvailableSlotsResult> {
  try {
    if (!serviceId) {
      return {
        success: false,
        slots: [],
        message: "Debes seleccionar un servicio.",
      };
    }

    if (!isValidDateString(date)) {
      return {
        success: false,
        slots: [],
        message: "La fecha seleccionada no es válida.",
      };
    }

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      select: {
        id: true,
        active: true,
        durationMinutes: true,
      },
    });

    if (!service) {
      return {
        success: false,
        slots: [],
        message: "El servicio no existe.",
      };
    }

    if (!service.active) {
      return {
        success: false,
        slots: [],
        message:
          "El servicio seleccionado no está disponible.",
      };
    }

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

    if (!settings) {
      return {
        success: false,
        slots: [],
        message: "La agenda todavía no está configurada.",
      };
    }

    /*
     * Google Calendar es obligatorio para consultar disponibilidad.
     */
    if (
      !settings.googleRefreshToken ||
      !settings.googleCalendarId
    ) {
      return {
        success: false,
        slots: [],
        message:
          "Google Calendar no está conectado. Conecta nuevamente Google Calendar.",
      };
    }

    const timezone =
      settings.timezone || "America/Mexico_City";

    /*
     * Inicio del día en la zona horaria de la clínica.
     */
    const dayStart = fromZonedTime(
      `${date}T00:00:00`,
      timezone
    );

    /*
     * Fin del día en la zona horaria de la clínica.
     */
    const dayEnd = fromZonedTime(
      `${date}T23:59:59.999`,
      timezone
    );

    /*
     * Consultamos las citas locales.
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

    /*
     * Consultamos Google Calendar.
     *
     * Si Google falla o la autorización fue revocada,
     * NO devolvemos slots. Google es la fuente externa
     * de verdad para la disponibilidad.
     */
    let googleBlockedRanges;

    try {
      googleBlockedRanges =
        await getCalendarEvents({
          calendarId:
            settings.googleCalendarId,

          refreshToken:
            settings.googleRefreshToken,

          timeMin: dayStart,
          timeMax: dayEnd,
        });
    } catch (error) {
      if (
        error instanceof GoogleReauthRequiredError
      ) {
        await prisma.settings.updateMany({
          data: {
            googleRefreshToken: null,
            googleCalendarId: null,
          },
        });

        return {
          success: false,
          slots: [],
          message:
            "GOOGLE_REAUTH_REQUIRED",
        };
      }

      console.error(
        "[getAvailableSlotsAction dashboard] Google Calendar error:",
        error
      );

      return {
        success: false,
        slots: [],
        message:
          "No fue posible comprobar la disponibilidad de Google Calendar. Intenta nuevamente.",
      };
    }

    /*
     * Si estamos editando una cita, excluimos también
     * su evento correspondiente de Google Calendar.
     *
     * De esta forma la propia cita no bloquea su nuevo horario.
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

    const externalBlockedRanges =
      googleBlockedRanges.filter(
        (range) =>
          !excludedGoogleEventId ||
          range.eventId !== excludedGoogleEventId
      );

    /*
     * Generamos los slots considerando:
     *
     * - horario de clínica
     * - excepciones
     * - citas PostgreSQL
     * - eventos Google Calendar
     * - duración
     * - buffer
     */
    const availableSlots =
      getAvailableSlots({
        date,
        timezone,
        appointments,
        externalBlockedRanges,

        openingTime:
          settings.openingTime,

        closingTime:
          settings.closingTime,

        interval:
          settings.slotIntervalMinutes,

        duration:
          service.durationMinutes,

        buffer:
          settings.appointmentBufferMinutes,

        businessDays:
          settings.businessDays,
      });

    /*
     * Nunca mostramos horarios que ya pasaron.
     */
    const now = new Date();

    const slots = availableSlots
      .filter(
        (slot) => slot > now
      )
      .map(
        (slot) => slot.toISOString()
      );

    return {
      success: true,
      slots,
    };
  } catch (error) {
    console.error(
      "[getAvailableSlotsAction dashboard]",
      error
    );

    return {
      success: false,
      slots: [],
      message:
        error instanceof Error
          ? error.message
          : "No fue posible consultar los horarios.",
    };
  }
}