import { getServices } from "./lib/queries";
import { CreateServiceDialog } from "./components/create-service-dialog";
import { ServiceTable } from "./components/service-table";

export default async function ServicesPage() {
  const services = await getServices();

  const serializedServices = services.map((service) => ({
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona los servicios disponibles de la clínica.
          </p>
        </div>

        <CreateServiceDialog />
      </div>

      <ServiceTable services={serializedServices} />
    </div>
  );
}