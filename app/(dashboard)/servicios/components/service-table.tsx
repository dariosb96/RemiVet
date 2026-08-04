import { Prisma } from "@prisma/client";

type Service = Prisma.ServiceGetPayload<{}>;

interface ServiceTableProps {
  services: Service[];
}

export function ServiceTable({ services }: ServiceTableProps) {
  if (!services.length) {
    return (
      <div className="rounded-xl border p-6 text-center">
        No hay servicios registrados.
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b text-left">
            <th className="p-4 whitespace-nowrap">Servicio</th>
            <th className="p-4 whitespace-nowrap">Duración</th>
            <th className="p-4 whitespace-nowrap">Precio</th>
            <th className="p-4 whitespace-nowrap">Estado</th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b">
              <td className="p-4 font-medium">{service.name}</td>
              <td className="p-4 whitespace-nowrap">
                {service.durationMinutes} min
              </td>
              <td className="p-4 whitespace-nowrap">
                ${service.price.toString()}
              </td>
              <td className="p-4">
                {service.active ? "Activo" : "Inactivo"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}