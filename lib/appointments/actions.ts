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

function isGoogleReauthError(
  error: unknown
): boolean {
  return (
    error instanceof GoogleReauthRequiredError ||
    isGoogleInvalidGrant(error)
  );
}

/* =========================================================
   CREATE
========================================================= */

export async function createAppointment(
  values: unknown
): Promise<AppointmentActionResult> {
  try {
    /*
     * prepareAppointment hace:
     *
     * - validación del servicio
     * - validación del horario
     * - PostgreSQL
     * - Google Calendar
     * - horario laboral
     * - buffer
     * - conflictos
     */
    const prepared = await prepareAppointment(
      values as Parameters<
        typeof prepareAppointment
      >[0]
    );

    /*
     * Obtenemos Google nuevamente antes de crear
     * el evento.
     */
    const settings =
      await getGoogleSettings();

    if (
      !settings?.googleCalendarId ||
      !settings.googleRefreshToken
    ) {
      return {
        success: false,
        googleConnected: false,
        message:
          "Google Calendar no está conectado. Conecta nuevamente Google Calendar antes de crear una cita.",
      };
    }

    /*
     * Necesitamos el nombre del servicio para construir
     * el evento de Google.
     */
    const service =
      await prisma.service.findUnique({
        where: {
          id: prepared.serviceId,
        },
        select: {
          name: true,
        },
      });

    if (!service) {
      return {
        success: false,
        message:
          "El servicio seleccionado ya no existe.",
      };
    }

    const eventData =
      buildCalendarEventData({
        ownerName: prepared.ownerName,
        phone: prepared.phone,
        email: prepared.email,
        petName: prepared.petName,
        notes: prepared.notes,
        startAt: prepared.startAt,
        endAt: prepared.endAt,
        service,
      });

    let googleEventId: string | null = null;

    /*
     * =====================================================
     * GOOGLE PRIMERO
     * =====================================================
     */
    try {
      googleEventId =
        await createCalendarEvent({
          calendarId:
            settings.googleCalendarId,
          refreshToken:
            settings.googleRefreshToken,
          ...eventData,
        });
    } catch (error) {
      console.error(
        "[createAppointment] Google error:",
        error
      );

      if (isGoogleReauthError(error)) {
        await disconnectGoogle(
          settings.id
        );

        return {
          success: false,
          googleConnected: false,
          message:
            "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
        };
      }

      return {
        success: false,
        googleConnected: true,
        message:
          "No fue posible crear la cita en Google Calendar. La cita no fue creada.",
      };
    }

    if (!googleEventId) {
      return {
        success: false,
        googleConnected: true,
        message:
          "Google Calendar no devolvió un identificador de evento. La cita no fue creada.",
      };
    }

    /*
     * =====================================================
     * POSTGRESQL DESPUÉS DE GOOGLE
     * =====================================================
     */
    try {
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
            googleEventId,
          },
        });

      return {
        success: true,
        appointmentId: appointment.id,
        googleConnected: true,
        message:
          "Cita creada correctamente.",
      };
    } catch (databaseError) {
      console.error(
        "[createAppointment] PostgreSQL error:",
        databaseError
      );

      /*
       * PostgreSQL falló después de crear Google.
       *
       * Intentamos eliminar el evento para no dejar
       * una cita huérfana en Google Calendar.
       */
      try {
        await deleteCalendarEvent({
          calendarId:
            settings.googleCalendarId,
          eventId: googleEventId,
          refreshToken:
            settings.googleRefreshToken,
        });
      } catch (rollbackError) {
        console.error(
          "[createAppointment] Google rollback error:",
          rollbackError
        );
      }

      return {
        success: false,
        googleConnected: true,
        message:
          "No fue posible guardar la cita. No se creó la cita localmente.",
      };
    }
  } catch (error) {
    console.error(
      "[createAppointment]",
      error
    );

    /*
     * prepareAppointment puede lanzar este error
     * cuando Google necesita reautenticación.
     */
    if (
      error instanceof Error &&
      error.message === "GOOGLE_REAUTH_REQUIRED"
    ) {
      return {
        success: false,
        googleConnected: false,
        message:
          "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
      };
    }

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

    /*
     * Cita actual.
     */
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
     * prepareAppointment excluye la propia cita
     * de la comprobación de disponibilidad.
     */
    const prepared =
      await prepareAppointment(
        values as Parameters<
          typeof prepareAppointment
        >[0],
        id
      );

    const settings =
      await getGoogleSettings();

    if (
      !settings?.googleCalendarId ||
      !settings.googleRefreshToken
    ) {
      return {
        success: false,
        googleConnected: false,
        message:
          "Google Calendar no está conectado. Conecta nuevamente Google Calendar antes de actualizar una cita.",
      };
    }

    /*
     * Servicio nuevo.
     */
    const service =
      await prisma.service.findUnique({
        where: {
          id: prepared.serviceId,
        },
        select: {
          name: true,
        },
      });

    if (!service) {
      return {
        success: false,
        message:
          "El servicio seleccionado ya no existe.",
      };
    }

    const eventData =
      buildCalendarEventData({
        ownerName: prepared.ownerName,
        phone: prepared.phone,
        email: prepared.email,
        petName: prepared.petName,
        notes: prepared.notes,
        startAt: prepared.startAt,
        endAt: prepared.endAt,
        service,
      });

    /*
     * =====================================================
     * GOOGLE PRIMERO
     * =====================================================
     */

    let googleEventId =
      current.googleEventId;

    /*
     * Guardamos los datos anteriores para poder
     * hacer rollback si PostgreSQL falla.
     */
    const previousEventData =
      buildCalendarEventData({
        ownerName: current.ownerName,
        phone: current.phone,
        email: current.email,
        petName: current.petName,
        notes: current.notes,
        startAt: current.startAt,
        endAt: current.endAt,
        service: current.service,
      });

    try {
      /*
       * La cita ya tiene evento.
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
      } else {
        /*
         * Por compatibilidad con citas antiguas que
         * no tengan googleEventId.
         */
        googleEventId =
          await createCalendarEvent({
            calendarId:
              settings.googleCalendarId,
            refreshToken:
              settings.googleRefreshToken,
            ...eventData,
          });

        if (!googleEventId) {
          return {
            success: false,
            googleConnected: true,
            message:
              "Google Calendar no devolvió un identificador de evento.",
          };
        }
      }
    } catch (error) {
      console.error(
        "[updateAppointment] Google error:",
        error
      );

      if (isGoogleReauthError(error)) {
        await disconnectGoogle(
          settings.id
        );

        return {
          success: false,
          appointmentId: id,
          googleConnected: false,
          message:
            "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
        };
      }

      return {
        success: false,
        appointmentId: id,
        googleConnected: true,
        message:
          "No fue posible actualizar la cita en Google Calendar. La cita no fue modificada.",
      };
    }

    /*
     * =====================================================
     * POSTGRESQL DESPUÉS DE GOOGLE
     * =====================================================
     */
    try {
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
          googleEventId,
        },
      });

      return {
        success: true,
        appointmentId: id,
        googleConnected: true,
        message:
          "Cita actualizada correctamente.",
      };
    } catch (databaseError) {
      console.error(
        "[updateAppointment] PostgreSQL error:",
        databaseError
      );

      /*
       * ===================================================
       * ROLLBACK GOOGLE
       * ===================================================
       */

      try {
        if (current.googleEventId) {
          await updateCalendarEvent({
            calendarId:
              settings.googleCalendarId,
            eventId:
              current.googleEventId,
            refreshToken:
              settings.googleRefreshToken,
            ...previousEventData,
          });
        } else if (googleEventId) {
          await deleteCalendarEvent({
            calendarId:
              settings.googleCalendarId,
            eventId: googleEventId,
            refreshToken:
              settings.googleRefreshToken,
          });
        }
      } catch (rollbackError) {
        console.error(
          "[updateAppointment] Google rollback error:",
          rollbackError
        );
      }

      return {
        success: false,
        appointmentId: id,
        googleConnected: true,
        message:
          "No fue posible guardar los cambios. Se intentó revertir Google Calendar.",
      };
    }
  } catch (error) {
    console.error(
      "[updateAppointment]",
      error
    );

    if (
      error instanceof Error &&
      error.message === "GOOGLE_REAUTH_REQUIRED"
    ) {
      return {
        success: false,
        appointmentId: id,
        googleConnected: false,
        message:
          "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
      };
    }

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

    /*
     * Si existe evento, Google debe confirmar primero
     * la eliminación.
     */
    if (appointment.googleEventId) {
      const settings =
        await getGoogleSettings();

      if (
        !settings?.googleCalendarId ||
        !settings.googleRefreshToken
      ) {
        return {
          success: false,
          appointmentId: id,
          googleConnected: false,
          message:
            "Google Calendar no está conectado. No se puede cancelar la cita hasta restablecer la conexión.",
        };
      }

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

        if (isGoogleReauthError(error)) {
          await disconnectGoogle(
            settings.id
          );

          return {
            success: false,
            appointmentId: id,
            googleConnected: false,
            message:
              "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
          };
        }

        return {
          success: false,
          appointmentId: id,
          googleConnected: true,
          message:
            "No fue posible cancelar la cita en Google Calendar. La cita no fue cancelada.",
        };
      }
    }

    /*
     * Google fue eliminado correctamente.
     *
     * Ahora cancelamos PostgreSQL.
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
      googleConnected: true,
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

    /*
     * Si tiene evento Google, lo eliminamos primero.
     */
    if (appointment.googleEventId) {
      const settings =
        await getGoogleSettings();

      if (
        !settings?.googleCalendarId ||
        !settings.googleRefreshToken
      ) {
        return {
          success: false,
          appointmentId: id,
          googleConnected: false,
          message:
            "Google Calendar no está conectado. No se puede eliminar permanentemente la cita hasta restablecer la conexión.",
        };
      }

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

        if (isGoogleReauthError(error)) {
          await disconnectGoogle(
            settings.id
          );

          return {
            success: false,
            appointmentId: id,
            googleConnected: false,
            message:
              "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
          };
        }

        return {
          success: false,
          appointmentId: id,
          googleConnected: true,
          message:
            "No fue posible eliminar la cita de Google Calendar. La cita no fue eliminada.",
        };
      }
    }

    /*
     * Google fue eliminado correctamente.
     *
     * Ahora eliminamos PostgreSQL.
     */
    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      appointmentId: id,
      googleConnected: true,
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
