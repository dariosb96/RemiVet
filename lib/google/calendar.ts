import {
  getAuthenticatedGoogleClient,
} from "./auth";

import { CalendarEventInput } from "./types";

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
    getAuthenticatedGoogleClient(refreshToken);

  const response =
    await calendar.events.insert({
      calendarId,

      requestBody: {
        summary: title,

        description: description ?? undefined,

        start: {
          dateTime: start.toISOString(),
          timeZone: "America/Mexico_City",
        },

        end: {
          dateTime: end.toISOString(),
          timeZone: "America/Mexico_City",
        },
      },
    });

  return response.data.id ?? null;
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
    getAuthenticatedGoogleClient(refreshToken);

  await calendar.events.update({
    calendarId,

    eventId,

    requestBody: {
      summary: title,

      description: description ?? undefined,

      start: {
        dateTime: start.toISOString(),
        timeZone: "America/Mexico_City",
      },

      end: {
        dateTime: end.toISOString(),
        timeZone: "America/Mexico_City",
      },
    },
  });
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
    getAuthenticatedGoogleClient(refreshToken);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

export async function getCalendarList(
  refreshToken: string
) {
  const calendar =
    getAuthenticatedGoogleClient(refreshToken);

  const response =
    await calendar.calendarList.list();

  return (
    response.data.items?.map((item) => ({
      id: item.id,
      summary: item.summary ?? "",
      description:
        item.description ?? null,
      primary: item.primary ?? false,
    })) ?? []
  );
}