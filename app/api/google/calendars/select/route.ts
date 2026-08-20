import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const calendarId = body.calendarId;

    if (
      typeof calendarId !== "string" ||
      !calendarId.trim()
    ) {
      return NextResponse.json(
        {
          error: "Calendar ID inválido.",
        },
        { status: 400 }
      );
    }

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "No existe la configuración de la clínica.",
        },
        { status: 404 }
      );
    }

    await prisma.settings.update({
      where: {
        id: settings.id,
      },
      data: {
        googleCalendarId: calendarId,
      },
    });

    return NextResponse.json({
      success: true,
      calendarId,
    });
  } catch (error) {
    console.error(
      "Google Calendar selection error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible guardar el calendario.",
      },
      { status: 500 }
    );
  }
}