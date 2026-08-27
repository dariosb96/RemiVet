import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  /**
   * =========================================================
   * USUARIO AUTENTICADO
   * =========================================================
   
   */
  if (session?.user) {
    redirect("/dashboard");
  }

  /**
 * USUARIO NO AUTENTICADO
     * Landing pública.
   */
  return (
    <main className="flex min-h-[calc(100vh-140px)] flex-col">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          {/* Logo / icono */}
          <div className="mb-6 text-5xl">
            🐾
          </div>

          {/* Nombre */}
          <h1 className="text-4xl font-bold tracking-tight text-purple-700 sm:text-5xl dark:text-purple-300">
            RemiVet
          </h1>

          {/* Descripción */}
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Reserva una cita para tu mascota
            de forma rápida y sencilla.
          </p>

          {/* CTA principal */}
          <div className="mt-8">
            <Link
              href="/reservar"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Agendar cita
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RemiVet
            {" · "}
            <Link
              href="/login"
              className="transition-colors hover:text-foreground hover:underline"
            >
              Acceso administrativo
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}