import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntroAnimation } from "@/components/layout/intro-animation";
import Image from "next/image";
import { ChevronDown, MapPin, Phone, Clock } from "lucide-react";
import { landingContent } from "@/data/landing";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen scroll-smooth">
      <IntroAnimation />

      {/* HERO */}
      <section
        id="inicio"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 flex flex-col items-center">
              <Image
                src="/Remi2.png"
                alt="Remi Vet"
                width={420}
                height={420}
                priority
                className="mx-auto h-auto w-[260px] sm:w-[320px]"
              />
            </div>

            <p className="mx-auto max-w-lg text-lg text-gray-300">
              Reserva una cita para tu animal de compañía
            </p>

            <div className="mt-8">
              <Link
                href="/reservar"
                className="inline-flex h-11 items-center justify-center rounded-md bg-pink-400 px-7 text-sm font-medium text-gray-100 shadow-sm transition-all hover:bg-pink-300 hover:text-gray-700 hover:shadow-md"
              >
                Agendar cita
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#servicios"
          aria-label="Ver servicios"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown size={32} strokeWidth={1.5} />
        </a>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="flex min-h-screen items-center px-6 py-20"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-pink-400">
              Nuestros servicios
            </p>

            <h2 className="text-3xl font-semibold sm:text-4xl">
              Cuidamos de quienes más quieres
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Conoce algunos de los servicios que tenemos disponibles para el
              cuidado y bienestar de tu animal de compañía.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {landingContent.services.map((service) => (
              <div
                key={service.title}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{service.title}</h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/reservar"
              className="inline-flex h-11 items-center justify-center rounded-md bg-pink-400 px-7 text-sm font-medium text-white transition-all hover:bg-pink-300 hover:text-gray-700"
            >
              Agendar cita
            </Link>
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section
        id="ubicacion"
        className="flex min-h-screen items-center px-6 py-20"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-pink-400">
              Visítanos
            </p>

            <h2 className="text-3xl font-semibold sm:text-4xl">
              Nuestra ubicación
            </h2>

            <div className="mt-8 space-y-6">
              {/* Dirección */}
              <div className="flex gap-4">
                <MapPin className="mt-1 shrink-0 text-pink-400" />

                <div>
                  <h3 className="font-medium">Dirección</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {landingContent.location.address}
                  </p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex gap-4">
                <Clock className="mt-1 shrink-0 text-pink-400" />

                <div>
                  <h3 className="font-medium">Horario</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {landingContent.location.schedule}
                  </p>
                </div>
              </div>
            </div>
          </div>

        <div className="overflow-hidden rounded-xl border shadow-sm">
  <iframe
    src={landingContent.location.embedUrl}
    width="100%"
    height="450"
    style={{ border: 0 }}
    allowFullScreen
    loading="lazy"
    referrerPolicy="strict-origin-when-cross-origin"
    title="Ubicación de Remi Vet"
    className="h-[350px] w-full sm:h-[450px]"
  />
</div>
        </div>
      </section>

      {/* CONTACTO */}
      <section
        id="contacto"
        className="flex min-h-[70vh] items-center px-6 py-20"
      >
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-pink-400">
            Contacto
          </p>

          <h2 className="text-3xl font-semibold sm:text-2xl">
            ¿Tienes alguna pregunta?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Estamos aquí para ayudarte. Contáctanos o agenda una cita para tu
            animal de compañía.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Teléfono */}
            <a
              href={`tel:${landingContent.contact.phone}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Phone size={18} />

              {landingContent.contact.displayPhone}
            </a>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 text-center sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RemiVet
          </p>

          <span className="hidden text-xs text-muted-foreground sm:inline">
            ·
          </span>

          <Link
            href="/login"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Acceso administrativo
          </Link>
        </div>
      </footer>
    </main>
  );
}