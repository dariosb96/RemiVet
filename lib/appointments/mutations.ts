import { prisma } from "@/lib/prisma";

import {
  createCalendarEvent,
  deleteCalendarEvent,
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
   CREATE APPOINTMENT - INTERNAL
   ---------------------------------------------------------
   Esta función NO valida sesión.

   La utilizan:
   - /reservar (público)
   - /citas (después de validar autenticación)
========================================================= */

export async function createAppointmentInternal(
  values: unknown
): Promise<AppointmentActionResult> {
  try {
    const prepared =
      await prepareAppointment(
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
     * Necesitamos el nombre del servicio para
     * construir el evento de Google.
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
        "[createAppointmentInternal] Google error:",
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
        appointmentId:
          appointment.id,
        googleConnected: true,
        message:
          "Cita creada correctamente.",
      };
    } catch (databaseError) {
      console.error(
        "[createAppointmentInternal] PostgreSQL error:",
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
          eventId:
            googleEventId,
          refreshToken:
            settings.googleRefreshToken,
        });
      } catch (rollbackError) {
        console.error(
          "[createAppointmentInternal] Google rollback error:",
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
      "[createAppointmentInternal]",
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