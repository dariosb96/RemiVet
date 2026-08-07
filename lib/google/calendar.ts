import { calendar_v3 } from "googleapis";

import { getGoogleCalendarClient } from "./auth";
import { CalendarEventInput } from "./types";

export async function createCalendarEvent({
  calendarId,
  title,
  description,
  start,
  end,
}: CalendarEventInput) {
  const calendar =
    getGoogleCalendarClient();

  const response =
    await calendar.events.insert({
      calendarId,

      requestBody: {
        summary: title,

        description,

        start: {
          dateTime: start.toISOString(),
          timeZone:
            "America/Mexico_City",
        },

        end: {
          dateTime: end.toISOString(),
          timeZone:
            "America/Mexico_City",
        },
      },
    });

  return response.data.id ?? null;
}

interface UpdateCalendarEventInput
  extends CalendarEventInput {
  eventId: string;
}

export async function updateCalendarEvent({
  calendarId,
  eventId,
  title,
  description,
  start,
  end,
}: UpdateCalendarEventInput) {
  const calendar =
    getGoogleCalendarClient();

  await calendar.events.update({
    calendarId,

    eventId,

    requestBody: {
      summary: title,

      description,

      start: {
        dateTime: start.toISOString(),
        timeZone:
          "America/Mexico_City",
      },

      end: {
        dateTime: end.toISOString(),
        timeZone:
          "America/Mexico_City",
      },
    },
  });
}

interface DeleteCalendarEventInput {
  calendarId: string;
  eventId: string;
}

export async function deleteCalendarEvent({
  calendarId,
  eventId,
}: DeleteCalendarEventInput) {
  const calendar =
    getGoogleCalendarClient();

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}