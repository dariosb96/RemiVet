import { Service } from "@prisma/client";

interface ServiceTableProps {
  services: Service[];
}

export function ServiceTable({
  services,
}: ServiceTableProps) {
  if (!services.length) {
    return (
      <div className="rounded-xl border p-6 text-center">
        No hay servicios registrados.
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="p-4">
              Servicio
            </th>

            <th className="p-4">
              Duración
            </th>

            <th className="p-4">
              Precio
            </th>

            <th className="p-4">
              Estado
            </th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) => (
            <tr
              key={service.id}
              className="border-b"
            >
              <td className="p-4 font-medium">
                {service.name}
              </td>

              <td className="p-4">
                {service.durationMinutes} min
              </td>

              <td className="p-4">
                ${service.price.toString()}
              </td>

              <td className="p-4">
                {service.active
                  ? "Activo"
                  : "Inactivo"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}