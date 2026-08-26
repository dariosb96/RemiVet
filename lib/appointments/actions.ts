"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google/calendar";

import {
  prepareAppointment,
} from "./appointment";

import {
  appointmentSchema,
} from "@/app/(dashboard)/citas/schema";

const APPOINTMENTS_PATH = "/citas";

/**
 * =========================================================
 * GOOGLE CONFIG
 * =========================================================
 */

function getGoogleConfig(settings: {
  googleRefreshToken?: string | null;
  googleCalendarId?: string | null;
}) {
  if (
    !settings.googleRefreshToken ||
    !settings.googleCalendarId
  ) {
    throw new Error(
      "Google Calendar no está configurado correctamente."
    );
  }

  return {
    refreshToken:
      settings.googleRefreshToken,

    calendarId:
      settings.googleCalendarId,
  };
}

/**
 * =========================================================
 * DESCRIPCIÓN GOOGLE CALENDAR
 * =========================================================
 */

function buildCalendarDescription({
  ownerName,
  phone,
  email,
  petName,
  serviceName,
  notes,
  appointmentId,
}: {
  ownerName: string;
  phone: string;
  email?: string | null;
  petName: string;
  serviceName: string;
  notes?: string | null;
  appointmentId: string;
}) {
  return [
    `Propietario: ${ownerName}`,
    `Teléfono: ${phone}`,

    email
      ? `Email: ${email}`
      : null,

    `Mascota: ${petName}`,
    `Servicio: ${serviceName}`,

    notes
      ? `Notas: ${notes}`
      : null,

    `ID de cita: ${appointmentId}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * =========================================================
 * CREAR CITA
 * =========================================================
 */

export async function createAppointment(
  values: unknown
) {
  const parsed =
    appointmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    const data =
      await prepareAppointment(
        parsed.data
      );

    const [
      settings,
      service,
    ] = await Promise.all([
      prisma.settings.findFirst(),

      prisma.service.findUnique({
        where: {
          id: data.serviceId,
        },

        select: {
          name: true,
        },
      }),
    ]);

    if (!settings) {
      return {
        success: false,
        message:
          "La configuración de la clínica no está disponible.",
      };
    }

    if (!service) {
      return {
        success: false,
        message:
          "El servicio no existe.",
      };
    }

    let googleConfig;

    try {
      googleConfig =
        getGoogleConfig(settings);
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Google Calendar no está configurado correctamente.",
      };
    }

    console.log(
      "[CREATE APPOINTMENT] parsed:",
      parsed.data
    );

    console.log(
      "[CREATE APPOINTMENT] prepared data:",
      data
    );

    console.log(
      "[CREATE APPOINTMENT] settings:",
      {
        googleCalendarId:
          settings.googleCalendarId,

        hasRefreshToken:
          !!settings.googleRefreshToken,
      }
    );

    /**
     * =======================================================
     * CREAR CITA EN DATABASE
     * =======================================================
     */

    const appointment =
      await prisma.appointment.create({
        data,
      });

    /**
     * =======================================================
     * CREAR EVENTO GOOGLE
     * =======================================================
     */

    try {
      console.log(
        "[CREATE APPOINTMENT] Creating Google Calendar event..."
      );

      const googleEventId =
        await createCalendarEvent({
          calendarId:
            googleConfig.calendarId,

          refreshToken:
            googleConfig.refreshToken,

          title:
            `RemiVet — ${service.name} — ${data.petName}`,

          description:
            buildCalendarDescription({
              ownerName:
                data.ownerName,

              phone:
                data.phone,

              email:
                data.email,

              petName:
                data.petName,

              serviceName:
                service.name,

              notes:
                data.notes,

              appointmentId:
                appointment.id,
            }),

          start:
            data.startAt,

          end:
            data.endAt,
        });

      if (!googleEventId) {
        throw new Error(
          "Google Calendar no devolvió un eventId."
        );
      }

      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },

        data: {
          googleEventId,
        },
      });

      revalidatePath(
        APPOINTMENTS_PATH
      );

      return {
        success: true,

        appointmentId:
          appointment.id,

        googleEventId,
      };
    } catch (googleError) {
      console.error(
        "[createAppointment] Google Calendar error:",
        googleError
      );

      await prisma.appointment.delete({
        where: {
          id: appointment.id,
        },
      });

      return {
        success: false,
        message:
          "No fue posible sincronizar la cita con Google Calendar.",
      };
    }
  } catch (error) {
    console.error(
      "[createAppointment] error:",
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

/**
 * =========================================================
 * ACTUALIZAR CITA
 * =========================================================
 */

export async function updateAppointment(
  id: string,
  values: unknown
) {
  const parsed =
    appointmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },

        include: {
          service: true,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message:
          "La cita no existe.",
      };
    }

    const data =
      await prepareAppointment(
        parsed.data,
        id
      );

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        message:
          "La configuración de la clínica no está disponible.",
      };
    }

    const googleConfig =
      getGoogleConfig(settings);

    /**
     * Actualizar Google Calendar
     */

    if (appointment.googleEventId) {
      await updateCalendarEvent({
        calendarId:
          googleConfig.calendarId,

        eventId:
          appointment.googleEventId,

        refreshToken:
          googleConfig.refreshToken,

        title:
          `RemiVet — ${appointment.service.name} — ${data.petName}`,

        description:
          buildCalendarDescription({
            ownerName:
              data.ownerName,

            phone:
              data.phone,

            email:
              data.email,

            petName:
              data.petName,

            serviceName:
              appointment.service.name,

            notes:
              data.notes,

            appointmentId:
              appointment.id,
          }),

        start:
          data.startAt,

        end:
          data.endAt,
      });
    }

    /**
     * Actualizar PostgreSQL
     */

    await prisma.appointment.update({
      where: {
        id,
      },

      data,
    });

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[updateAppointment] error:",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la cita.",
    };
  }
}

/**
 * =========================================================
 * CANCELAR CITA
 * =========================================================
 *
 * Mantiene el registro en PostgreSQL,
 * pero elimina el evento de Google Calendar.
 */

export async function deleteAppointment(
  id: string
) {
  try {
    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          googleEventId: true,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message:
          "La cita no existe.",
      };
    }

    const settings =
      await prisma.settings.findFirst();

    /**
     * Eliminar evento de Google si existe.
     */

    if (
      appointment.googleEventId &&
      settings?.googleRefreshToken &&
      settings?.googleCalendarId
    ) {
      try {
        await deleteCalendarEvent({
          calendarId:
            settings.googleCalendarId,

          eventId:
            appointment.googleEventId,

          refreshToken:
            settings.googleRefreshToken,
        });
      } catch (googleError) {
        console.error(
          "[deleteAppointment] Google Calendar error:",
          googleError
        );

        /**
         * No impedimos cancelar la cita localmente
         * si Google falla.
         */
      }
    }

    /**
     * Cancelar localmente.
     */

    await prisma.appointment.update({
      where: {
        id,
      },

      data: {
        status: "CANCELLED",
        googleEventId: null,
      },
    });

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[deleteAppointment] error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message:
          "La cita ya no existe.",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible cancelar la cita.",
    };
  }
}

/**
 * =========================================================
 * ELIMINAR CITA DEFINITIVAMENTE
 * =========================================================
 *
 * Esta función:
 *
 * 1. Busca la cita.
 * 2. Elimina su evento de Google Calendar si existe.
 * 3. Elimina completamente la cita de PostgreSQL.
 *
 * Después de esto la cita deja de existir.
 */

export async function hardDeleteAppointment(
  id: string
) {
  try {
    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          googleEventId: true,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message:
          "La cita no existe.",
      };
    }

    /**
     * =======================================================
     * OBTENER CONFIGURACIÓN GOOGLE
     * =======================================================
     */

    const settings =
      await prisma.settings.findFirst();

    /**
     * =======================================================
     * ELIMINAR EVENTO DE GOOGLE
     * =======================================================
     */

    if (
      appointment.googleEventId &&
      settings?.googleRefreshToken &&
      settings?.googleCalendarId
    ) {
      try {
        await deleteCalendarEvent({
          calendarId:
            settings.googleCalendarId,

          eventId:
            appointment.googleEventId,

          refreshToken:
            settings.googleRefreshToken,
        });
      } catch (googleError) {
        console.error(
          "[hardDeleteAppointment] Google Calendar error:",
          googleError
        );

        /**
         * No detenemos la eliminación local.
         *
         * La cita debe poder eliminarse aunque Google
         * esté temporalmente desconectado.
         */
      }
    }

    /**
     * =======================================================
     * ELIMINAR DE POSTGRESQL
     * =======================================================
     */

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[hardDeleteAppointment] error:",
      error
    );

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2025") {
        return {
          success: false,
          message:
            "La cita ya no existe.",
        };
      }
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la cita definitivamente.",
    };
  }
}