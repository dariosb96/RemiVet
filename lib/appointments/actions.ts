
"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  GoogleReauthRequiredError,
} from "@/lib/google/calendar";

import { isGoogleInvalidGrant } from "@/lib/google/errors";

import { prepareAppointment } from "@/lib/appointments/appointment";

import {
  createAppointmentInternal,
} from "@/lib/appointments/mutations";

export interface AppointmentActionResult {
  success: boolean;
  message?: string;
  appointmentId?: string;
  googleConnected?: boolean;
}

/* =========================================================
   AUTH
========================================================= */

async function requireAuth() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
}

/* =========================================================
   GOOGLE
========================================================= */

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

function buildCalendarEventData(
  appointment: {
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
  }
) {
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
    error instanceof
      GoogleReauthRequiredError ||
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
    await requireAuth();

    return await createAppointmentInternal(
      values
    );
  } catch (error) {
    console.error(
      "[createAppointment]",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message: "No autorizado.",
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
    await requireAuth();

    if (!id) {
      return {
        success: false,
        message: "La cita no es válida.",
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

    const prepared =
      await prepareAppointment(
        values as Parameters<
          typeof prepareAppointment
        >[0],
        id
      );

    const settings =
      await getGoogleSettings();

    if (!settings) {
      return {
        success: false,
        googleConnected: false,
        message:
          "No existe configuración de Google Calendar.",
      };
    }

    const calendarId =
      settings.googleCalendarId;

    const refreshToken =
      settings.googleRefreshToken;

    if (!calendarId || !refreshToken) {
      return {
        success: false,
        googleConnected: false,
        message:
          "Google Calendar no está conectado. Conecta nuevamente Google Calendar.",
      };
    }

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
        ownerName:
          prepared.ownerName,

        phone:
          prepared.phone,

        email:
          prepared.email,

        petName:
          prepared.petName,

        notes:
          prepared.notes,

        startAt:
          prepared.startAt,

        endAt:
          prepared.endAt,

        service,
      });

    const previousEventData =
      buildCalendarEventData({
        ownerName:
          current.ownerName,

        phone:
          current.phone,

        email:
          current.email,

        petName:
          current.petName,

        notes:
          current.notes,

        startAt:
          current.startAt,

        endAt:
          current.endAt,

        service:
          current.service,
      });

    let googleEventId =
      current.googleEventId;

    try {
      if (googleEventId) {
        await updateCalendarEvent({
          calendarId,
          eventId:
            googleEventId,
          refreshToken,
          ...eventData,
        });
      } else {
        googleEventId =
          await createCalendarEvent({
            calendarId,
            refreshToken,
            ...eventData,
          });
      }
    } catch (error) {
      console.error(
        "[updateAppointment] Google error:",
        error
      );

      if (
        isGoogleReauthError(error)
      ) {
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
          "No fue posible actualizar la cita en Google Calendar.",
      };
    }

    if (!googleEventId) {
      return {
        success: false,
        googleConnected: true,
        message:
          "Google Calendar no devolvió un identificador de evento.",
      };
    }

    try {
      await prisma.appointment.update({
        where: {
          id,
        },
        data: {
          ownerName:
            prepared.ownerName,

          phone:
            prepared.phone,

          email:
            prepared.email,

          petName:
            prepared.petName,

          serviceId:
            prepared.serviceId,

          startAt:
            prepared.startAt,

          endAt:
            prepared.endAt,

          notes:
            prepared.notes,

          status:
            prepared.status,

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
       * Rollback de Google.
       */
      try {
        if (current.googleEventId) {
          await updateCalendarEvent({
            calendarId,
            eventId:
              current.googleEventId,
            refreshToken,
            ...previousEventData,
          });
        } else if (googleEventId) {
          await deleteCalendarEvent({
            calendarId,
            eventId:
              googleEventId,
            refreshToken,
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
        googleConnected: true,
        message:
          "No fue posible guardar los cambios de la cita.",
      };
    }
  } catch (error) {
    console.error(
      "[updateAppointment]",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message: "No autorizado.",
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
   DELETE / CANCEL
========================================================= */

export async function deleteAppointment(
  id: string
): Promise<AppointmentActionResult> {
  try {
    await requireAuth();

    if (!id) {
      return {
        success: false,
        message: "La cita no es válida.",
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
      appointment.status ===
      "CANCELLED"
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

    if (
      appointment.googleEventId
    ) {
      if (!settings) {
        return {
          success: false,
          googleConnected: false,
          message:
            "No existe configuración de Google Calendar.",
        };
      }

      const calendarId =
        settings.googleCalendarId;

      const refreshToken =
        settings.googleRefreshToken;

      if (!calendarId || !refreshToken) {
        return {
          success: false,
          googleConnected: false,
          message:
            "Google Calendar no está conectado. No se puede eliminar el evento.",
        };
      }

      try {
        await deleteCalendarEvent({
          calendarId,
          eventId:
            appointment.googleEventId,
          refreshToken,
        });
      } catch (error) {
        console.error(
          "[deleteAppointment] Google error:",
          error
        );

        if (
          isGoogleReauthError(
            error
          )
        ) {
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
            "No fue posible eliminar el evento de Google Calendar.",
        };
      }
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

    return {
      success: true,
      appointmentId: id,
      googleConnected:
        appointment.googleEventId
          ? true
          : undefined,
      message:
        "Cita cancelada correctamente.",
    };
  } catch (error) {
    console.error(
      "[deleteAppointment]",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message: "No autorizado.",
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

/* =========================================================
   HARD DELETE
========================================================= */

export async function hardDeleteAppointment(
  id: string
): Promise<AppointmentActionResult> {
  try {
    await requireAuth();

    if (!id) {
      return {
        success: false,
        message: "La cita no es válida.",
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

    if (
      appointment.googleEventId
    ) {
      if (!settings) {
        return {
          success: false,
          googleConnected: false,
          message:
            "No existe configuración de Google Calendar.",
        };
      }

      const calendarId =
        settings.googleCalendarId;

      const refreshToken =
        settings.googleRefreshToken;

      if (!calendarId || !refreshToken) {
        return {
          success: false,
          googleConnected: false,
          message:
            "Google Calendar no está conectado. No se puede eliminar el evento.",
        };
      }

      try {
        await deleteCalendarEvent({
          calendarId,
          eventId:
            appointment.googleEventId,
          refreshToken,
        });
      } catch (error) {
        console.error(
          "[hardDeleteAppointment] Google error:",
          error
        );

        if (
          isGoogleReauthError(
            error
          )
        ) {
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
            "No fue posible eliminar el evento de Google Calendar.",
        };
      }
    }

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      appointmentId: id,
      googleConnected:
        appointment.googleEventId
          ? true
          : undefined,
      message:
        "Cita eliminada correctamente.",
    };
  } catch (error) {
    console.error(
      "[hardDeleteAppointment]",
      error
    );

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message: "No autorizado.",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la cita.",
    };
  }
}
