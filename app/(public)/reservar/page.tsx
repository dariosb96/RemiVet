import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { ServiceDTO } from "@/types/appointment";

export default async function ReservePage() {
  const rawServices = await prisma.service.findMany({
    where: {
      active: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  const services: ServiceDTO[] =
    rawServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price.toNumber(),
      active: service.active,
      displayOrder: service.displayOrder,
      color: service.color,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Reserva tu cita
        </h1>

        <p className="mt-2 text-muted-foreground">
          Selecciona el servicio que deseas reservar.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            No hay servicios disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/reservar/${service.id}`}
              className="group rounded-xl border bg-card p-5 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-3">
                <div>
                  <h2 className="font-semibold">
                    {service.name}
                  </h2>

                  {service.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {service.durationMinutes} min
                  </span>

                  <span className="font-medium">
                    ${service.price.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 text-sm font-medium">
                  Reservar →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}