"use server";

import { prisma } from "@/lib/prisma";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  GoogleReauthRequiredError,
} from "@/lib/google/calendar";

import { isGoogleInvalidGrant } from "@/lib/google/errors";

import {
  prepareAppointment,
} from "@/lib/appointments/appointment";

export interface AppointmentActionResult {
  success: boolean;
  message?: string;
  appointmentId?: string;
  googleConnected?: boolean;
}

async function getGoogleSettings() {
  return prisma.settings.findFirst({
    select: {
      id: true,
      googleCalendarId: true,
      googleRefreshToken: true,
    },
  });
}

async function disconnectGoogle(
  settingsId: string
) {
  await prisma.settings.update({
    where: {
      id: settingsId,
    },
    data: {
      googleCalendarId: null,
      googleRefreshToken: null,
    },
  });
}

function buildCalendarEventData(appointment: {
  ownerName: string;
  phone: string;
  email: string | null;
  petName: string;
  notes: string | null;
  startAt: Date;
  endAt: Date;
  service: {
    name: string;
  };
}) {
  const description = [
    `Propietario: ${appointment.ownerName}`,
    `Teléfono: ${appointment.phone}`,
    appointment.email
      ? `Email: ${appointment.email}`
      : null,
    `Mascota: ${appointment.petName}`,
    appointment.notes
      ? `Notas: ${appointment.notes}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: `${appointment.service.name} - ${appointment.petName}`,
    description,
    start: appointment.startAt,
    end: appointment.endAt,
  };
}

/* =========================================================
   CREATE
========================================================= */

export async function createAppointment(
  values: unknown
): Promise<AppointmentActionResult> {
  try {
    const prepared = await prepareAppointment(
      values as Parameters<
        typeof prepareAppointment
      >[0]
    );

    /*
     * PostgreSQL es la fuente de verdad.
     *
     * La cita se crea SIEMPRE localmente antes de intentar
     * sincronizar con Google Calendar.
     */
    const appointment =
      await prisma.appointment.create({
        data: {
          ownerName: prepared.ownerName,
          phone: prepared.phone,
          email: prepared.email,
          petName: prepared.petName,
          serviceId: prepared.serviceId,
          startAt: prepared.startAt,
          endAt: prepared.endAt,
          notes: prepared.notes,
          status: prepared.status,
        },

        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      });

    const settings =
      await getGoogleSettings();

    /*
     * Google es opcional.
     */
    if (
      !settings?.googleCalendarId ||
      !settings.googleRefreshToken
    ) {
      return {
        success: true,
        appointmentId: appointment.id,
        googleConnected: false,
        message:
          "Cita creada correctamente. Google Calendar está desconectado.",
      };
    }

    try {
      const eventData =
        buildCalendarEventData(
          appointment
        );

      const googleEventId =
        await createCalendarEvent({
          calendarId:
            settings.googleCalendarId,
          refreshToken:
            settings.googleRefreshToken,
          ...eventData,
        });

      if (googleEventId) {
        await prisma.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            googleEventId,
          },
        });
      }

      return {
        success: true,
        appointmentId: appointment.id,
        googleConnected: true,
        message:
          "Cita creada correctamente.",
      };
    } catch (error) {
      console.error(
        "[createAppointment] Google error:",
        error
      );

      if (
        error instanceof
          GoogleReauthRequiredError ||
        isGoogleInvalidGrant(error)
      ) {
        await disconnectGoogle(
          settings.id
        );
      }

      /*
       * MUY IMPORTANTE:
       *
       * NO eliminamos la cita de PostgreSQL.
       */
      return {
        success: true,
        appointmentId: appointment.id,
        googleConnected: false,
        message:
          "Cita creada correctamente, pero no pudo sincronizarse con Google Calendar.",
      };
    }
  } catch (error) {
    console.error(
      "[createAppointment]",
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

/* =========================================================
   UPDATE
========================================================= */

export async function updateAppointment(
  id: string,
  values: unknown
): Promise<AppointmentActionResult> {
  try {
    if (!id) {
      return {
        success: false,
        message:
          "No se recibió el identificador de la cita.",
      };
    }

    const current =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      });

    if (!current) {
      return {
        success: false,
        message: "La cita no existe.",
      };
    }

    /*
     * Excluimos la propia cita para que no choque consigo misma.
     */
    const prepared =
      await prepareAppointment(
        values as Parameters<
          typeof prepareAppointment
        >[0],
        id
      );

    /*
     * PostgreSQL primero.
     */
    const updated =
      await prisma.appointment.update({
        where: {
          id,
        },

        data: {
          ownerName: prepared.ownerName,
          phone: prepared.phone,
          email: prepared.email,
          petName: prepared.petName,
          serviceId: prepared.serviceId,
          startAt: prepared.startAt,
          endAt: prepared.endAt,
          notes: prepared.notes,
          status: prepared.status,
        },

        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      });

    const settings =
      await getGoogleSettings();

    /*
     * Sin Google conectado, la actualización local
     * ya está completa.
     */
    if (
      !settings?.googleCalendarId ||
      !settings.googleRefreshToken
    ) {
      return {
        success: true,
        appointmentId: id,
        googleConnected: false,
        message:
          "Cita actualizada correctamente. Google Calendar está desconectado.",
      };
    }

    try {
      const eventData =
        buildCalendarEventData(
          updated
        );

      /*
       * Ya tenía evento → UPDATE.
       */
      if (current.googleEventId) {
        await updateCalendarEvent({
          calendarId:
            settings.googleCalendarId,
          eventId:
            current.googleEventId,
          refreshToken:
            settings.googleRefreshToken,
          ...eventData,
        });

        return {
          success: true,
          appointmentId: id,
          googleConnected: true,
          message:
            "Cita actualizada correctamente.",
        };
      }

      /*
       * No tenía evento → CREATE.
       *
       * Esto cubre citas creadas mientras Google estaba
       * desconectado.
       */
      const googleEventId =
        await createCalendarEvent({
          calendarId:
            settings.googleCalendarId,
          refreshToken:
            settings.googleRefreshToken,
          ...eventData,
        });

      if (googleEventId) {
        await prisma.appointment.update({
          where: {
            id,
          },
          data: {
            googleEventId,
          },
        });
      }

      return {
        success: true,
        appointmentId: id,
        googleConnected: true,
        message:
          "Cita actualizada y sincronizada correctamente.",
      };
    } catch (error) {
      console.error(
        "[updateAppointment] Google error:",
        error
      );

      if (
        error instanceof
          GoogleReauthRequiredError ||
        isGoogleInvalidGrant(error)
      ) {
        await disconnectGoogle(
          settings.id
        );
      }

      /*
       * PostgreSQL YA fue actualizado.
       * No hacemos rollback por error de Google.
       */
      return {
        success: true,
        appointmentId: id,
        googleConnected: false,
        message:
          "Cita actualizada correctamente, pero no pudo sincronizarse con Google Calendar.",
      };
    }
  } catch (error) {
    console.error(
      "[updateAppointment]",
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

/* =========================================================
   CANCEL
========================================================= */

export async function deleteAppointment(
  id: string
): Promise<AppointmentActionResult> {
  try {
    if (!id) {
      return {
        success: false,
        message:
          "No se recibió el identificador de la cita.",
      };
    }

    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message: "La cita no existe.",
      };
    }

    if (
      appointment.status === "CANCELLED"
    ) {
      return {
        success: true,
        appointmentId: id,
        message:
          "La cita ya estaba cancelada.",
      };
    }

    const settings =
      await getGoogleSettings();

    /*
     * Intentamos borrar Google.
     *
     * Si falla, continuamos.
     */
    if (
      appointment.googleEventId &&
      settings?.googleCalendarId &&
      settings.googleRefreshToken
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
      } catch (error) {
        console.error(
          "[deleteAppointment] Google error:",
          error
        );

        if (
          error instanceof
            GoogleReauthRequiredError ||
          isGoogleInvalidGrant(error)
        ) {
          await disconnectGoogle(
            settings.id
          );
        }
      }
    }

    /*
     * CANCELACIÓN LOCAL SIEMPRE.
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

    return {
      success: true,
      appointmentId: id,
      message:
        "Cita cancelada correctamente.",
    };
  } catch (error) {
    console.error(
      "[deleteAppointment]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible cancelar la cita.",
    };
  }
}

/* =========================================================
   HARD DELETE
========================================================= */

export async function hardDeleteAppointment(
  id: string
): Promise<AppointmentActionResult> {
  try {
    if (!id) {
      return {
        success: false,
        message:
          "No se recibió el identificador de la cita.",
      };
    }

    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message: "La cita no existe.",
      };
    }

    const settings =
      await getGoogleSettings();

    /*
     * Intentamos eliminar evento de Google.
     *
     * El hard delete local NO depende de que Google responda.
     */
    if (
      appointment.googleEventId &&
      settings?.googleCalendarId &&
      settings.googleRefreshToken
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
      } catch (error) {
        console.error(
          "[hardDeleteAppointment] Google error:",
          error
        );

        if (
          error instanceof
            GoogleReauthRequiredError ||
          isGoogleInvalidGrant(error)
        ) {
          await disconnectGoogle(
            settings.id
          );
        }
      }
    }

    /*
     * Eliminación definitiva de PostgreSQL.
     */
    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      appointmentId: id,
      message:
        "Cita eliminada permanentemente.",
    };
  } catch (error) {
    console.error(
      "[hardDeleteAppointment]",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la cita.",
    };
  }
}