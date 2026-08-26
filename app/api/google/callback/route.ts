import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getGoogleTokens,
} from "@/lib/google/auth";

export async function GET(
  request: NextRequest
) {
  try {
    const code =
      request.nextUrl.searchParams.get(
        "code"
      );

    const error =
      request.nextUrl.searchParams.get(
        "error"
      );

    if (error) {
      return NextResponse.redirect(
        new URL(
          "/configuracion?google=error",
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/configuracion?google=error",
          request.url
        )
      );
    }

    const tokens =
      await getGoogleTokens(code);

    /*
     * Con access_type=offline + prompt=consent
     * esperamos recibir refresh_token.
     */

    if (!tokens.refresh_token) {
      console.error(
        "[GOOGLE OAUTH] No refresh token returned."
      );

      return NextResponse.redirect(
        new URL(
          "/configuracion?google=no_refresh_token",
          request.url
        )
      );
    }

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.redirect(
        new URL(
          "/configuracion?google=settings_error",
          request.url
        )
      );
    }

    /*
     * Guardamos el NUEVO refresh token.
     *
     * También limpiamos el calendario anterior.
     * Esto obliga a seleccionar nuevamente uno
     * perteneciente a la nueva autorización.
     */

    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        googleRefreshToken:
          tokens.refresh_token,

        googleCalendarId:
          null,
      },
    });

    console.log(
      "[GOOGLE OAUTH] Google Calendar connected successfully."
    );

    return NextResponse.redirect(
      new URL(
        "/configuracion?google=connected",
        request.url
      )
    );
  } catch (error) {
    console.error(
      "[GOOGLE OAUTH CALLBACK] error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/configuracion?google=error",
        request.url
      )
    );
  }
}