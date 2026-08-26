"use server";

import { prisma } from "@/lib/prisma";

import {
  getCalendarList,
} from "@/lib/google/calendar";

import {
  isGoogleInvalidGrant,
} from "@/lib/google/errors";

/*
 * =========================================================
 * TIPOS
 * =========================================================
 */

type CalendarOption = {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
};

type GoogleActionSuccess = {
  success: true;
};

type GoogleActionError = {
  success: false;
  error: string;
  code?: string;
};

/*
 * =========================================================
 * OBTENER CALENDARIOS
 * =========================================================
 */
export async function getGoogleCalendarsAction(): Promise<
  | {
      success: true;
      calendars: CalendarOption[];
    }
  | {
      success: false;
      calendars: [];
      error: string;
      code?: string;
    }
> {
  const settings =
    await prisma.settings.findFirst();

  if (!settings) {
    return {
      success: false,
      calendars: [],
      error:
        "No existe la configuración de la clínica.",
    };
  }

  /*
   * No hay refresh token.
   *
   * Esto significa directamente que hay que
   * conectar/reconectar Google.
   */
  if (!settings.googleRefreshToken) {
    return {
      success: false,
      calendars: [],
      error:
        "Google Calendar no está conectado.",
      code:
        "GOOGLE_REAUTH_REQUIRED",
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
      "[getGoogleCalendarsAction] error:",
      error
    );

    /*
     * =======================================================
     * INVALID_GRANT
     * =======================================================
     *
     * El refresh token ya no sirve.
     *
     * Lo eliminamos automáticamente de Prisma.
     *
     * El usuario NO tiene que abrir Prisma Studio.
     */
    if (
      isGoogleInvalidGrant(error)
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

      return {
        success: false,

        calendars: [],

        code:
          "GOOGLE_REAUTH_REQUIRED",

        error:
          "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
      };
    }

    return {
      success: false,

      calendars: [],

      error:
        "No fue posible obtener los calendarios.",
    };
  }
}

/*
 * =========================================================
 * SELECCIONAR CALENDARIO
 * =========================================================
 */
export async function selectGoogleCalendarAction(
  calendarId: string
): Promise<
  GoogleActionSuccess |
  GoogleActionError
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

  /*
   * No existe refresh token.
   */
  if (!settings.googleRefreshToken) {
    return {
      success: false,
      error:
        "Google Calendar no está conectado.",
      code:
        "GOOGLE_REAUTH_REQUIRED",
    };
  }

  try {
    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        googleCalendarId:
          calendarId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "[selectGoogleCalendarAction] error:",
      error
    );

    if (
      isGoogleInvalidGrant(error)
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

      return {
        success: false,

        code:
          "GOOGLE_REAUTH_REQUIRED",

        error:
          "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
      };
    }

    return {
      success: false,

      error:
        "No fue posible guardar el calendario.",
    };
  }
}