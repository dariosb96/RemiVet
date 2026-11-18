import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntroAnimation } from "@/components/layout/intro-animation";
import Image from "next/image";
import { ChevronDown, MapPin, Phone, Clock } from "lucide-react";
import { landingContent } from "@/data/landing";

const eyebrow =
  "mb-2 text-sm font-medium uppercase tracking-widest text-pink-600 dark:text-pink-400";
const sectionTitle = "text-3xl font-semibold sm:text-4xl";

function CtaButton() {
  return (
    <Link
      href="/reservar"
      className="inline-flex h-11 items-center justify-center rounded-md bg-pink-600 px-7 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      Agendar cita
    </Link>
  );
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-dvh">
      <IntroAnimation />

      {/* HERO */}
      <section
        id="inicio"
        className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-pink-400/15 via-pink-400/5 to-transparent px-6 text-center dark:from-pink-400/10 dark:via-pink-400/5"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl">
            <div className="mb-2 flex flex-col items-center">
              <Image
                src="/Remi2.png"
                alt="Remi Vet"
                width={420}
                height={420}
                sizes="(min-width: 640px) 320px, 260px"
                priority
                className="mx-auto h-auto w-[260px] sm:w-[320px]"
              />
            </div>

            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Reserva una cita para tu animal de compañía
            </p>

            <div className="mt-8">
              <CtaButton />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#servicios"
          aria-label="Ver servicios"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground transition-colors hover:text-foreground motion-reduce:animate-none"
        >
          <ChevronDown size={32} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="border-y bg-muted/50 px-6 py-20 sm:py-24"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-12 text-center">
            <p className={eyebrow}>Nuestros servicios</p>

            <h2 className={sectionTitle}>Cuidamos de quienes más quieres</h2>

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
            <CtaButton />
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section
        id="ubicacion"
        className="bg-pink-400/10 px-6 py-20 sm:py-24 dark:bg-pink-400/[0.07]"
      >
        <div className="mx-auto grid w-full max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className={eyebrow}>Visítanos</p>

            <h2 className={sectionTitle}>Nuestra ubicación</h2>

            <div className="mt-8 space-y-6">
              {/* Dirección */}
              <div className="flex gap-4">
                <MapPin
                  className="mt-1 shrink-0 text-pink-600 dark:text-pink-400"
                  aria-hidden="true"
                />

                <div>
                  <h3 className="font-medium">Dirección</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {landingContent.location.address}
                  </p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex gap-4">
                <Clock
                  className="mt-1 shrink-0 text-pink-600 dark:text-pink-400"
                  aria-hidden="true"
                />

                <div>
                  <h3 className="font-medium">Horario</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {landingContent.location.schedule}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <iframe
              src={landingContent.location.embedUrl}
              width="100%"
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
        className="border-y bg-muted/50 px-6 py-20 sm:py-24"
      >
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className={eyebrow}>Contacto</p>

          <h2 className={sectionTitle}>¿Tienes alguna pregunta?</h2>

          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Estamos aquí para ayudarte. Contáctanos o agenda una cita para tu
            animal de compañía.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Teléfono */}
            <a
              href={`tel:${landingContent.contact.phone}`}
              className="inline-flex h-11 items-center gap-2 rounded-md border bg-card px-6 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Phone size={18} aria-hidden="true" />

              {landingContent.contact.displayPhone}
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-muted/80 px-6 py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 text-center sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RemiVet
          </p>

          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            aria-hidden="true"
          >
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