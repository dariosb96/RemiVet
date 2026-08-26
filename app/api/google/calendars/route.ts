import {
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getCalendarList,
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
          connected: false,
          error:
            "Google Calendar no está conectado.",
        },
        { status: 401 }
      );
    }

    try {
      const calendars =
        await getCalendarList(
          settings.googleRefreshToken
        );

      return NextResponse.json({
        success: true,
        connected: true,
        calendars,
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

            connected: false,

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
      "Google Calendar list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "No fue posible obtener los calendarios.",
      },
      { status: 500 }
    );
  }
}