import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntroAnimation } from "@/components/layout/intro-animation";
import Image from "next/image";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <IntroAnimation />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          {/* Logo / icono */}
          <div className="mb-2 flex flex-col items-center text-center">
            <Image
              src="/Remi2.png"
              alt="Remi Vet"
              width={420}
              height={420}
              priority
              className="mx-auto h-auto w-[260px] sm:w-[320px]"
            />
          </div>

          {/* Descripción */}
          <p className="mx-auto max-w-lg text-lg text-gray-300">
            Reserva una cita para tu mascota
          </p>

          {/* CTA principal */}
          <div className="mt-8">
            <Link
              href="/reservar"
              className="inline-flex h-11 items-center justify-center  rounded-md bg-pink-400 px-7 text-sm font-medium text-gray-100 shadow-sm transition-all hover:bg-pink-300 hover:shadow-md hover:text-gray-700"
            >
              Agendar cita
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-auto border-t px-6 py-5">
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