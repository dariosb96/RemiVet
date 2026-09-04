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