import {
  getAuthenticatedGoogleClient,
} from "./auth";

import {
  isGoogleInvalidGrant,
} from "./errors";

import type {
  CalendarEventInput,
} from "./types";

export class GoogleReauthRequiredError extends Error {
  constructor() {
    super(
      "La conexión con Google Calendar expiró o fue revocada."
    );

    this.name =
      "GoogleReauthRequiredError";
  }
}

function handleGoogleError(
  error: unknown
): never {
  if (isGoogleInvalidGrant(error)) {
    throw new GoogleReauthRequiredError();
  }

  throw error;
}

/*
 * =========================================================
 * CREAR EVENTO
 * =========================================================
 */
export async function createCalendarEvent({
  calendarId,
  title,
  description,
  start,
  end,
  refreshToken,
}: CalendarEventInput & {
  refreshToken: string;
}) {
  const calendar =
    getAuthenticatedGoogleClient(
      refreshToken
    );

  try {
    const response =
      await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: title,
          description:
            description ?? undefined,

          start: {
            dateTime:
              start.toISOString(),
            timeZone:
              "America/Mexico_City",
          },

          end: {
            dateTime:
              end.toISOString(),
            timeZone:
              "America/Mexico_City",
          },
        },
      });

    return response.data.id ?? null;
  } catch (error) {
    handleGoogleError(error);
  }
}

/*
 * =========================================================
 * ACTUALIZAR EVENTO
 * =========================================================
 */
export async function updateCalendarEvent({
  calendarId,
  eventId,
  title,
  description,
  start,
  end,
  refreshToken,
}: CalendarEventInput & {
  eventId: string;
  refreshToken: string;
}) {
  const calendar =
    getAuthenticatedGoogleClient(
      refreshToken
    );

  try {
    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: {
        summary: title,
        description:
          description ?? undefined,

        start: {
          dateTime:
            start.toISOString(),
          timeZone:
            "America/Mexico_City",
        },

        end: {
          dateTime:
            end.toISOString(),
          timeZone:
            "America/Mexico_City",
        },
      },
    });
  } catch (error) {
    handleGoogleError(error);
  }
}

/*
 * =========================================================
 * ELIMINAR EVENTO
 * =========================================================
 */
export async function deleteCalendarEvent({
  calendarId,
  eventId,
  refreshToken,
}: {
  calendarId: string;
  eventId: string;
  refreshToken: string;
}) {
  const calendar =
    getAuthenticatedGoogleClient(
      refreshToken
    );

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    handleGoogleError(error);
  }
}

/*
 * =========================================================
 * LISTA DE CALENDARIOS
 * =========================================================
 */
export async function getCalendarList(
  refreshToken: string
) {
  const calendar =
    getAuthenticatedGoogleClient(
      refreshToken
    );

  try {
    const response =
      await calendar.calendarList.list();

    return (
      response.data.items
        ?.filter(
          (
            item
          ): item is typeof item & {
            id: string;
          } => Boolean(item.id)
        )
        .map((item) => ({
          id: item.id!,
          summary:
            item.summary ?? "",
          description:
            item.description ?? null,
          primary:
            item.primary ?? false,
        })) ?? []
    );
  } catch (error) {
    handleGoogleError(error);
  }
}

/*
 * =========================================================
 * OBTENER EVENTOS DE UN CALENDARIO
 * =========================================================
 *
 * Se utiliza para determinar qué horarios ya están ocupados
 * directamente en Google Calendar.
 *
 * timeMin / timeMax deben ser Date reales (UTC internamente).
 *
 * singleEvents: true
 * Permite que eventos recurrentes se expandan correctamente.
 */
export interface GoogleCalendarBlockedRange {
  start: Date;
  end: Date;
  eventId: string;
}

export async function getCalendarEvents({
  calendarId,
  refreshToken,
  timeMin,
  timeMax,
}: {
  calendarId: string;
  refreshToken: string;
  timeMin: Date;
  timeMax: Date;
}): Promise<GoogleCalendarBlockedRange[]> {
  const calendar =
    getAuthenticatedGoogleClient(
      refreshToken
    );

  try {
    const response =
      await calendar.events.list({
        calendarId,

        timeMin:
          timeMin.toISOString(),

        timeMax:
          timeMax.toISOString(),

        singleEvents: true,

        orderBy: "startTime",

        showDeleted: false,
      });

    const events =
      response.data.items ?? [];

    const blockedRanges: GoogleCalendarBlockedRange[] =
      [];

    for (const event of events) {
      /*
       * Eventos eliminados no deben bloquear.
       */
      if (
        event.status ===
        "cancelled"
      ) {
        continue;
      }

      /*
       * Los eventos de día completo tienen `date`
       * en lugar de `dateTime`.
       *
       * Para disponibilidad horaria de una clínica,
       * un evento de día completo debe bloquear todo
       * el rango que Google proporciona.
       */
      const startValue =
        event.start?.dateTime ??
        event.start?.date;

      const endValue =
        event.end?.dateTime ??
        event.end?.date;

      if (
        !startValue ||
        !endValue
      ) {
        continue;
      }

      const start =
        new Date(startValue);

      const end =
        new Date(endValue);

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {
        continue;
      }

      if (end <= start) {
        continue;
      }

      blockedRanges.push({
        start,
        end,
        eventId:
          event.id ?? "",
      });
    }

    return blockedRanges;
  } catch (error) {
    handleGoogleError(error);
  }
}