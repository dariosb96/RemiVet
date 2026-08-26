import {
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  createCalendarEvent,
} from "@/lib/google/calendar";

import {
  isGoogleInvalidGrant,
} from "@/lib/google/errors";

export async function GET() {
  try {
    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No existe la configuración de la clínica.",
        },
        { status: 404 }
      );
    }

    if (!settings.googleRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          code:
            "GOOGLE_REAUTH_REQUIRED",
          error:
            "Google Calendar no está conectado.",
        },
        { status: 401 }
      );
    }

    if (!settings.googleCalendarId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No hay un calendario de Google seleccionado.",
        },
        { status: 400 }
      );
    }

    const start =
      new Date(
        Date.now() +
          60 * 60 * 1000
      );

    const end =
      new Date(
        start.getTime() +
          30 * 60 * 1000
      );

    try {
      const eventId =
        await createCalendarEvent({
          calendarId:
            settings.googleCalendarId,

          refreshToken:
            settings.googleRefreshToken,

          title:
            "RemiVet — Evento de prueba",

          description:
            "Evento creado automáticamente desde RemiVet para comprobar la integración con Google Calendar.",

          start,
          end,
        });

      return NextResponse.json({
        success: true,

        eventId,

        calendarId:
          settings.googleCalendarId,

        start,
        end,
      });
    } catch (error) {
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

        return NextResponse.json(
          {
            success: false,

            code:
              "GOOGLE_REAUTH_REQUIRED",

            error:
              "La conexión con Google Calendar expiró o fue revocada. Es necesario volver a conectar Google Calendar.",
          },
          { status: 401 }
        );
      }

      throw error;
    }
  } catch (error) {
    console.error(
      "Google Calendar test event error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "No fue posible crear el evento de prueba.",
      },
      { status: 500 }
    );
  }
}