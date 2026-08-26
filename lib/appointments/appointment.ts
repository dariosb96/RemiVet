import { prisma } from "@/lib/prisma";

import type { AppointmentFormValues } from "@/app/(dashboard)/citas/schema";

/**
 * Convierte fecha + hora en Date.
 *
 * Las fechas se interpretan en la zona horaria local
 * del servidor/runtime.
 */
export function buildStartDate(
  date: string,
  time: string
): Date {
  const startAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(startAt.getTime())) {
    throw new Error("Fecha u hora inválida.");
  }

  return startAt;
}

/**
 * Calcula la hora de finalización según la duración
 * configurada para el servicio.
 */
export function calculateEndAt(
  startAt: Date,
  durationMinutes: number
): Date {
  return new Date(
    startAt.getTime() + durationMinutes * 60_000
  );
}

/**
 * Comprueba si existe una cita que se traslape
 * con el intervalo solicitado.
 */
export async function isSlotAvailable(
  startAt: Date,
  endAt: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflict =
    await prisma.appointment.findFirst({
      where: {
        ...(excludeAppointmentId
          ? {
              id: {
                not: excludeAppointmentId,
              },
            }
          : {}),

        status: {
          not: "CANCELLED",
        },

        startAt: {
          lt: endAt,
        },

        endAt: {
          gt: startAt,
        },
      },

      select: {
        id: true,
      },
    });

  return !conflict;
}

/**
 * Prepara y valida los datos de una cita.
 *
 * Esta función NO crea la cita.
 * Solamente:
 *
 * - obtiene el servicio
 * - calcula startAt
 * - calcula endAt
 * - verifica que no haya pasado
 * - verifica disponibilidad
 * - normaliza los datos
 */
export async function prepareAppointment(
  values: AppointmentFormValues,
  excludeAppointmentId?: string
) {
  const service =
    await prisma.service.findUnique({
      where: {
        id: values.serviceId,
      },

      select: {
        id: true,
        durationMinutes: true,
      },
    });

  if (!service) {
    throw new Error("Servicio no encontrado.");
  }

  const startAt = buildStartDate(
    values.date,
    values.time
  );

  const endAt = calculateEndAt(
    startAt,
    service.durationMinutes
  );

  if (startAt <= new Date()) {
    throw new Error("Ese horario ya pasó.");
  }

  const available =
    await isSlotAvailable(
      startAt,
      endAt,
      excludeAppointmentId
    );

  if (!available) {
    throw new Error(
      "Ya existe una cita en ese horario."
    );
  }

  return {
    ownerName: values.ownerName.trim(),

    phone: values.phone.trim(),

    email:
      values.email?.trim() || null,

    petName:
      values.petName.trim(),

    serviceId:
      service.id,

    startAt,

    endAt,

    notes:
      values.notes?.trim() || null,

    status:
      values.status,
  };
}