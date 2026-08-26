import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-2xl">
        <div className="mb-6 text-5xl text-blue-800">
          🐾
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-purple-700">
          RemiVet
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          Reserva una cita de forma rápida y sencilla.
          
        </p>

        <div className="mt-8">
          <Link
            href="/reservar"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Agendar cita
          </Link>
        </div>
      </div>
    </main>
  );
}