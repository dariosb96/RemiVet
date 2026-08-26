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
  isGoogleInvalidGrant,
} from "@/lib/google/errors";
import {
  prepareAppointment,
} from "./appointment";

import {
  appointmentSchema,
} from "@/app/(dashboard)/citas/schema";

const APPOINTMENTS_PATH = "/citas";

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
 *
 * Esta función es utilizada tanto por:
 *
 * - Dashboard
 * - Reserva pública
 *
 * La lógica real vive aquí.
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
    googleCalendarId: settings.googleCalendarId,
    hasRefreshToken:
      !!settings.googleRefreshToken,
  }
);

console.log(
  "[CREATE APPOINTMENT] Creating Google Calendar event..."
);
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

    /*
     * Crear cita en PostgreSQL.
     */
    const appointment =
      await prisma.appointment.create({
        data,
      });

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

      /*
       * Google revocó o invalidó el refresh token.
       *
       * Invalidamos la conexión inmediatamente.
       */
      if (
        isGoogleInvalidGrant(
          googleError
        )
      ) {
        await prisma.settings.update({
          where: {
            id: settings.id,
          },

          data: {
            googleRefreshToken:
              null,

            googleCalendarId:
              null,
          },
        });

        /*
         * La cita no se puede considerar creada
         * porque todavía no fue sincronizada.
         */

        await prisma.appointment.delete({
          where: {
            id: appointment.id,
          },
        });

        return {
          success: false,

          code:
            "GOOGLE_REAUTH_REQUIRED",

          message:
            "La conexión con Google Calendar expiró o fue revocada. Es necesario volver a conectar Google Calendar.",
        };
      }

      /*
       * Cualquier otro error de Google.
       */

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

    if (
      appointment.googleEventId &&
      settings?.googleRefreshToken &&
      settings?.googleCalendarId
    ) {
      await deleteCalendarEvent({
        calendarId:
          settings.googleCalendarId,

        eventId:
          appointment.googleEventId,

        refreshToken:
          settings.googleRefreshToken,
      });
    }

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