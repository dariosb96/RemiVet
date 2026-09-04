import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  "/dashboard",
  "/citas",
  "/servicios",
  "/configuracion",
];

export async function proxy(
  request: NextRequest
) {
  const { pathname, search } =
    request.nextUrl;

  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET,
  });

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   */

  if (
    pathname === "/login" ||
    pathname.startsWith("/login/")
  ) {
    if (token?.id) {
      return NextResponse.redirect(
        new URL(
          "/dashboard",
          request.url
        )
      );
    }

    return NextResponse.next();
  }

  /*
   * =========================================================
   * SETUP
   * =========================================================
   *
   * La existencia del usuario se comprueba desde
   * PostgreSQL en el Server Component de /setup.
   *
   * No usamos el JWT para decidir si /setup existe.
   */

  if (
    pathname === "/setup" ||
    pathname.startsWith("/setup/")
  ) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * RUTAS PROTEGIDAS
   * =========================================================
   */

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(
          `${route}/`
        )
    );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  /*
   * =========================================================
   * SIN TOKEN
   * =========================================================
   */

  if (!token?.id) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${search}`
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * =========================================================
   * TOKEN PRESENTE
   * =========================================================
   *
   * La validación definitiva de que el usuario existe
   * se realiza en las páginas/server actions protegidas.
   *
   * El JWT ya no se considera válido únicamente por
   * estar presente: debe contener token.id.
   */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",

    "/setup",
    "/setup/:path*",

    "/dashboard/:path*",
    "/citas/:path*",
    "/servicios/:path*",
    "/configuracion/:path*",
  ],
};