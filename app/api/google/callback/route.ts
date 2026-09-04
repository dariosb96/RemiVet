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
  console.log(
    "[GOOGLE CALLBACK] Inicio:",
    request.url
  );

  const redirect = (
    request: NextRequest,
    query: string
  ) => {
    return NextResponse.redirect(
      new URL(
        `/configuracion?google=${query}`,
        request.url
      )
    );
  };

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
      console.error(
        "[GOOGLE CALLBACK] Google devolvió error:",
        error
      );

      return redirect(
        request,
        "error"
      );
    }

    if (!code) {
      console.error(
        "[GOOGLE CALLBACK] No se recibió authorization code."
      );

      return redirect(
        request,
        "error"
      );
    }

    console.log(
      "[GOOGLE CALLBACK] Authorization code recibido."
    );

    const tokens =
      await getGoogleTokens(code);

    console.log(
      "[GOOGLE CALLBACK] Token exchange completado.",
      {
        accessToken:
          Boolean(
            tokens.access_token
          ),

        refreshToken:
          Boolean(
            tokens.refresh_token
          ),

        expiryDate:
          tokens.expiry_date ??
          null,
      }
    );

    if (!tokens.refresh_token) {
      console.error(
        "[GOOGLE CALLBACK] Google no devolvió refresh_token."
      );

      return redirect(
        request,
        "no_refresh_token"
      );
    }

    const settings =
      await prisma.settings.findFirst({
        select: {
          id: true,
          googleRefreshToken: true,
          googleCalendarId: true,
        },
      });

    console.log(
      "[GOOGLE CALLBACK] Settings:",
      settings
        ? {
            id: settings.id,

            hasPreviousRefreshToken:
              Boolean(
                settings.googleRefreshToken
              ),

            previousCalendarId:
              settings.googleCalendarId,
          }
        : "NO EXISTE"
    );

    if (!settings) {
      console.error(
        "[GOOGLE CALLBACK] No existe ningún registro en Settings."
      );

      return redirect(
        request,
        "settings_error"
      );
    }

    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        googleRefreshToken:
          tokens.refresh_token,

        googleCalendarId: null,
      },
    });

    console.log(
      "[GOOGLE CALLBACK] Conexión de Google guardada.",
      {
        settingsId:
          settings.id,
      }
    );

    return redirect(
      request,
      "connected"
    );
  } catch (error) {
    console.error(
      "[GOOGLE CALLBACK] Error completo:",
      error
    );

    if (error instanceof Error) {
      console.error(
        "[GOOGLE CALLBACK] Error name:",
        error.name
      );

      console.error(
        "[GOOGLE CALLBACK] Error message:",
        error.message
      );

      console.error(
        "[GOOGLE CALLBACK] Error stack:",
        error.stack
      );
    }

    return redirect(
      request,
      "error"
    );
  }
}