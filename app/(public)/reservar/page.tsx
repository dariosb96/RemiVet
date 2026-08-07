import { prisma } from "@/lib/prisma";

import { ServiceCard } from "./components/service-card";

export default async function ReservarPage() {
  const services =
    await prisma.service.findMany({
      where: {
        active: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

  return (
    <main className="container mx-auto max-w-5xl px-6 py-10">

      <div className="mb-10 text-center">

        <h1 className="text-4xl font-bold">
          Agenda una cita
        </h1>

        <p className="mt-2 text-muted-foreground">
          Selecciona el servicio que deseas
          reservar.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
          />
        ))}

      </div>

    </main>
  );
}