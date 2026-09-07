import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";

import { CreateAppointmentDialog } from "./components/create-appointment-dialog";
import { AppointmentsTable } from "./components/appointments-table";

import type {
  ServiceDTO,
  AppointmentDTO,
} from "@/types/appointment";

export const dynamic = "force-dynamic";

export default async function CitasPage() {
  const [rawAppointments, rawServices] =
    await Promise.all([
      prisma.appointment.findMany({
        include: {
          service: true,
        },

        orderBy: {
          startAt: "desc",
        },
      }),

      prisma.service.findMany({
        where: {
          active: true,
        },

        orderBy: {
          displayOrder: "asc",
        },
      }),
    ]);

  const services: ServiceDTO[] = rawServices.map(
    (service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      active: service.active,
      displayOrder: service.displayOrder,
      color: service.color,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    })
  );

  /*
   * Las citas también necesitan serialización porque
   * contienen Decimal y Date.
   */
  const appointments: AppointmentDTO[] =
    rawAppointments.map((appointment) => ({
      id: appointment.id,
      googleEventId:
        appointment.googleEventId,

      serviceId: appointment.serviceId,

      service: {
        id: appointment.service.id,
        name: appointment.service.name,
        description:
          appointment.service.description,
        durationMinutes:
          appointment.service.durationMinutes,
        price: Number(appointment.service.price),
        active: appointment.service.active,
        displayOrder:
          appointment.service.displayOrder,
        color: appointment.service.color,
        createdAt:
          appointment.service.createdAt.toISOString(),
        updatedAt:
          appointment.service.updatedAt.toISOString(),
      },

      ownerName: appointment.ownerName,
      phone: appointment.phone,
      email: appointment.email,
      petName: appointment.petName,

      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),

      status: appointment.status,
      notes: appointment.notes,

      createdAt:
        appointment.createdAt.toISOString(),
      updatedAt:
        appointment.updatedAt.toISOString(),
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Citas
          </h1>

        </div>

        <CreateAppointmentDialog
          services={services}
        >
          <Button 
          className="bg-cyan-200 text-black hover:bg-black hover:text-cyan-500 focus:ring-cyan-500">
            Nueva cita
          </Button>
        </CreateAppointmentDialog>
      </div>

      <AppointmentsTable
        appointments={appointments}
        services={services}
      />
    </div>
  );
}