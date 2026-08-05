import { getAppointments } from "./actions";

export default async function AppointmentsPage() {
  const appointments = await getAppointments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Citas
        </h1>

        <p className="text-muted-foreground">
          Administra las citas de la clínica.
        </p>
      </div>

      <div className="rounded-xl border">
        {appointments.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No hay citas registradas.
          </div>
        ) : (
          <div>
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border-b p-4"
              >
                <p className="font-medium">
                  {appointment.ownerName}
                </p>

                <p className="text-sm">
                  Mascota: {appointment.petName}
                </p>

                <p className="text-sm">
                  Servicio: {appointment.service.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}