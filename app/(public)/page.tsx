import Link from "next/link";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Agenda la cita de tu mascota
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
        Reserva una consulta de forma rápida y sencilla.
        Elige el servicio, la fecha y la hora disponible.
      </p>

      <Link
        href="/reservar"
        className="mt-10 rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:opacity-90"
      >
        Agendar cita
      </Link>

      <div className="mt-24 grid w-full gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Atención profesional
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Agenda consultas para tu mascota en pocos pasos.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Horarios disponibles
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Consulta horarios disponibles en tiempo real.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold">
            Confirmación inmediata
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Recibe tu reservación al instante.
          </p>
        </div>
      </div>
    </section>
  );
}