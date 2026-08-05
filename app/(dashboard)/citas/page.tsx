import { prisma } from "@/lib/prisma";

import { Button } from "@/components/ui/button";

import { CreateAppointmentDialog } from "./components/create-appointment-dialog";
import { AppointmentsTable } from "./components/appointments-table";

export default async function CitasPage() {

  const [
    appointments,
    services,
  ] = await Promise.all([
    prisma.appointment.findMany({
      include:{
        service:true,
      },
      orderBy:{
        startAt:"desc",
      },
    }),

    prisma.service.findMany({
      where:{
        active:true,
      },
      orderBy:{
        displayOrder:"asc",
      },
    }),
  ]);


  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-semibold">
            Citas
          </h1>

          <p className="text-sm text-muted-foreground">
            Administra las citas de la clínica.
          </p>
        </div>


        <CreateAppointmentDialog
          services={services}
        >
          <Button>
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