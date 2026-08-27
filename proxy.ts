import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = [
  "/dashboard",
  "/citas",
  "/servicios",
  "/configuracion",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  /*
   * =========================================================
   * OBTENER SESIÓN
   * =========================================================
   */

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  /*
   * =========================================================
   * LOGIN
   * =========================================================
   *
   * Si el usuario YA está autenticado y entra a /login,
   * lo mandamos directamente al dashboard.
   *
   * Esto evita que un administrador con sesión activa
   * vuelva a ver el formulario de login.
   */

  if (
    pathname === "/login" ||
    pathname.startsWith("/login/")
  ) {
    if (token) {
      const dashboardUrl = new URL(
        "/dashboard",
        request.url
      );

      return NextResponse.redirect(
        dashboardUrl
      );
    }

    return NextResponse.next();
  }

  /*
   * RUTAS PROTEGIDAS
   */

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );

  /*
   * Si no es una ruta protegida,
   * dejamos continuar normalmente.
   *
   * Esto incluye:
   *
   * /
   * /reservar
   * /api/...
   * etc.
   */

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  /*
   * SIN SESIÓN
   */

  if (!token) {
    const loginUrl = new URL(
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
   * SESIÓN VÁLIDA
   */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",

    "/dashboard/:path*",
    "/citas/:path*",
    "/servicios/:path*",
    "/configuracion/:path*",
  ],
};