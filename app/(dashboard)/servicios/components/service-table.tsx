import { Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DeleteServiceDialog } from "./delete-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";
import { ToggleServiceButton } from "./toggle-service-button";

interface ServiceTableItem {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  displayOrder: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ServiceTableProps {
  services: ServiceTableItem[];
}

export function ServiceTable({ services }: ServiceTableProps) {
  if (!services.length) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="font-medium">No hay servicios registrados.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea el primer servicio para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-4 font-medium">Servicio</th>
            <th className="p-4 font-medium">Duración</th>
            <th className="p-4 font-medium">Precio</th>
            <th className="p-4 font-medium">Estado</th>
            <th className="p-4 text-right font-medium">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b last:border-0">
              <td className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1.5 h-3 w-3 shrink-0 rounded-full border"
                    style={{
                      backgroundColor: service.color ?? "#3b82f6",
                    }}
                  />

                  <div className="min-w-0">
                    <p className="font-medium">{service.name}</p>

                    {service.description && (
                      <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              <td className="p-4 whitespace-nowrap">
                {service.durationMinutes} min
              </td>

              <td className="p-4 whitespace-nowrap">
                ${service.price.toFixed(2)}
              </td>

              <td className="p-4">
                {service.active ? (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Inactivo
                  </span>
                )}
              </td>

              <td className="p-4">
                <div className="flex items-center justify-end gap-2">
                  <EditServiceDialog service={service}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </EditServiceDialog>

                  <ToggleServiceButton
                    id={service.id}
                    active={service.active}
                  />

                  <DeleteServiceDialog service={service}>
                    <Button
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </DeleteServiceDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}