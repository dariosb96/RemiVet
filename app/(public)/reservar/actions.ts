"use server";

import { fromZonedTime } from "date-fns-tz";
import {
  getCalendarEvents,
  GoogleReauthRequiredError,
} from "@/lib/google/calendar";
import { prisma } from "@/lib/prisma";

import {
  getAvailableSlots,
} from "@/lib/appointments/availability";

import {
  createAppointment,
} from "@/lib/appointments/actions";

export interface AvailableSlotsResult {
  success: boolean;
  slots: string[];
  message?: string;
}

interface GetAvailableSlotsInput {
  serviceId: string;
  date: string;
}

export interface PublicAppointmentFormValues {
  ownerName: string;
  phone: string;
  email?: string;
  petName: string;
  serviceId: string;
  startAt: string;
  notes?: string;
}

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

function getClinicDate(
  instant: Date,
  timezone: string
): string {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(instant);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    throw new Error(
      "No fue posible determinar la fecha."
    );
  }

  return `${year}-${month}-${day}`;
}

function getClinicTime(
  instant: Date,
  timezone: string
): string {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).formatToParts(instant);

  const hour = parts.find(
    (part) => part.type === "hour"
  )?.value;

  const minute = parts.find(
    (part) => part.type === "minute"
  )?.value;

  if (!hour || !minute) {
    throw new Error(
      "No fue posible determinar la hora."
    );
  }

  return `${hour}:${minute}`;
}

/* =========================================================
   AVAILABILITY
========================================================= */

export async function getAvailableSlotsAction({
  serviceId,
  date,
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

    const [service, settings] =
      await Promise.all([
        prisma.service.findUnique({
          where: {
            id: serviceId,
          },

          select: {
            id: true,
            active: true,
            durationMinutes: true,
          },
        }),

        prisma.settings.findFirst({
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
        }),
      ]);

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

    if (!settings) {
      return {
        success: false,
        slots: [],
        message:
          "La agenda todavía no está configurada.",
      };
    }

    /*
     * Sin Google Calendar no podemos garantizar
     * disponibilidad real.
     */
    if (
      !settings.googleRefreshToken ||
      !settings.googleCalendarId
    ) {
      return {
        success: false,
        slots: [],
        message:
          "Google Calendar no está conectado. La agenda no está disponible en este momento.",
      };
    }

    const timezone =
      settings.timezone ||
      "America/Mexico_City";

    const dayStart = fromZonedTime(
      `${date}T00:00:00`,
      timezone
    );

    const dayEnd = fromZonedTime(
      `${date}T23:59:59.999`,
      timezone
    );

    /*
     * Citas almacenadas localmente.
     */
    const appointments =
      await prisma.appointment.findMany({
        where: {
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
     * Eventos reales de Google Calendar.
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
        "[getAvailableSlotsAction public] Google Calendar error:",
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
     * PostgreSQL + Google Calendar.
     */
    const availableSlots =
      getAvailableSlots({
        date,
        timezone,
        appointments,
        externalBlockedRanges:
          googleBlockedRanges,

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
     * Nunca mostramos horarios pasados.
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
      "[getAvailableSlotsAction public]",
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

/* =========================================================
   CREATE PUBLIC
========================================================= */

export async function createPublicAppointment(
  values: PublicAppointmentFormValues
) {
  try {
    if (!values.startAt) {
      return {
        success: false,
        message:
          "Debes seleccionar un horario.",
      };
    }

    const startAt = new Date(
      values.startAt
    );

    if (
      Number.isNaN(
        startAt.getTime()
      )
    ) {
      return {
        success: false,
        message:
          "El horario seleccionado no es válido.",
      };
    }

    const settings =
      await prisma.settings.findFirst({
        select: {
          timezone: true,
        },
      });

    if (!settings) {
      return {
        success: false,
        message:
          "La agenda todavía no está configurada.",
      };
    }

    const timezone =
      settings.timezone ||
      "America/Mexico_City";

    const date = getClinicDate(
      startAt,
      timezone
    );

    /*
     * Volvemos a consultar disponibilidad inmediatamente
     * antes de crear.
     */
    const availability =
      await getAvailableSlotsAction({
        serviceId:
          values.serviceId,
        date,
      });

    if (!availability.success) {
      return {
        success: false,
        message:
          availability.message ??
          "No fue posible verificar la disponibilidad.",
      };
    }

    const requestedTimestamp =
      startAt.getTime();

    const stillAvailable =
      availability.slots.some(
        (slot) =>
          new Date(
            slot
          ).getTime() ===
          requestedTimestamp
      );

    if (!stillAvailable) {
      return {
        success: false,
        message:
          "Ese horario ya no está disponible. Selecciona otro horario.",
      };
    }

    const time = getClinicTime(
      startAt,
      timezone
    );

    return createAppointment({
      ownerName:
        values.ownerName,

      phone:
        values.phone,

      email:
        values.email,

      petName:
        values.petName,

      serviceId:
        values.serviceId,

      date,

      time,

      notes:
        values.notes,

      status:
        "PENDING",
    });
  } catch (error) {
    console.error(
      "[createPublicAppointment]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible crear la cita.",
    };
  }
}