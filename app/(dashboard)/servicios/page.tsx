import { prisma } from "@/lib/prisma";
import { ServiceTable } from "./components/service-table";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: {
      displayOrder: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Servicios
        </h1>

        <p className="text-muted-foreground">
          Gestiona los servicios disponibles de la clínica.
        </p>
      </div>

      <ServiceTable services={services} />
    </div>
  );
}