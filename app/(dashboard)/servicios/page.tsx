import { getServices } from "./lib/queries";
import { CreateServiceDialog } from "./components/create-service-dialog";
import { ServiceTable } from "./components/service-table";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Servicios
          </h1>

          <p className="text-muted-foreground">
            Gestiona los servicios disponibles de la clínica.
          </p>
        </div>

        <CreateServiceDialog />
      </div>

      <ServiceTable services={services} />
    </div>
  );
}