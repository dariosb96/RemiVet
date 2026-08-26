import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold">
          🐾 RemiVet
        </Link>

        <Link
          href="/reservar"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Agenda una  cita
        </Link>
      </div>
    </header>
  );
}