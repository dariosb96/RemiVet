import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCalendarList } from "@/lib/google/calendar";

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

    const calendars = await getCalendarList(
      settings.googleRefreshToken
    );

    return NextResponse.json({
      calendars,
    });
  } catch (error) {
    console.error(
      "Google Calendar list error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible obtener los calendarios.",
      },
      { status: 500 }
    );
  }
}