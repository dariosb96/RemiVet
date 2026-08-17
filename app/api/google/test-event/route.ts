import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google/calendar";

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();

    if (!settings?.googleRefreshToken) {
      return NextResponse.json(
        {
          error: "Google Calendar no está conectado.",
        },
        { status: 400 }
      );
    }

    const calendarId =
      settings.googleCalendarId ??
      "dariosb96@gmail.com";

    const start = new Date(
      Date.now() + 60 * 60 * 1000
    );

    const end = new Date(
      start.getTime() + 30 * 60 * 1000
    );

    const eventId = await createCalendarEvent({
      calendarId,
      refreshToken:
        settings.googleRefreshToken,

      title: "RemiVet — Evento de prueba",

      description:
        "Evento creado automáticamente desde RemiVet para probar la integración con Google Calendar.",

      start,
      end,
    });

    return NextResponse.json({
      success: true,
      eventId,
      calendarId,
      start,
      end,
    });
  } catch (error) {
    console.error(
      "Google Calendar test event error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible crear el evento de prueba.",
      },
      { status: 500 }
    );
  }
}