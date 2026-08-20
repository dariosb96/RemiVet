"use server";

import { prisma } from "@/lib/prisma";

import {
  getCalendarList,
} from "@/lib/google/calendar";

export async function getGoogleCalendarsAction(): Promise<
  | {
      success: true;
      calendars: {
        id: string;
        summary: string;
        description: string | null;
        primary: boolean;
      }[];
      error?: undefined;
    }
  | {
      success: false;
      calendars: [];
      error: string;
    }
> {
  const settings =
    await prisma.settings.findFirst();

  if (!settings?.googleRefreshToken) {
    return {
      success: false,
      calendars: [],
      error:
        "Google Calendar no está conectado.",
    };
  }

  try {
    const calendars =
      await getCalendarList(
        settings.googleRefreshToken
      );

    return {
      success: true,
      calendars,
    };
  } catch (error) {
    console.error(
      "Get Google calendars error:",
      error
    );

    return {
      success: false,
      calendars: [],
      error:
        "No fue posible obtener los calendarios.",
    };
  }
}

export async function selectGoogleCalendarAction(
  calendarId: string
): Promise<
  | {
      success: true;
      error?: undefined;
    }
  | {
      success: false;
      error: string;
    }
> {
  if (!calendarId.trim()) {
    return {
      success: false,
      error:
        "Selecciona un calendario.",
    };
  }

  const settings =
    await prisma.settings.findFirst();

  if (!settings) {
    return {
      success: false,
      error:
        "No existe la configuración de la clínica.",
    };
  }

  await prisma.settings.update({
    where: {
      id: settings.id,
    },
    data: {
      googleCalendarId: calendarId,
    },
  });

  return {
    success: true,
  };
}