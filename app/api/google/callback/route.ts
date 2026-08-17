import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getGoogleTokens } from "@/lib/google/auth";

export async function GET(
  request: NextRequest
) {
  try {
    const code =
      request.nextUrl.searchParams.get("code");

    const error =
      request.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/configuracion?google=error`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          error:
            "No se recibió el código de autorización.",
        },
        { status: 400 }
      );
    }

    const tokens =
      await getGoogleTokens(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          error:
            "Google no devolvió un refresh token.",
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
        googleRefreshToken:
          tokens.refresh_token,
      },
    });

    return NextResponse.redirect(
      new URL(
        "/configuracion?google=connected",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "Google Calendar OAuth error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible conectar Google Calendar.",
      },
      { status: 500 }
    );
  }
}