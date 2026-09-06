import { prisma } from "@/lib/prisma";
import type { AppointmentFormValues } from "@/app/(dashboard)/citas/schema";
import {
  buildZonedDate,
  getAvailableSlots,
} from "@/lib/appointments/availability";

export async function isSlotAvailable(
  startAt: Date,
  endAt: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conflict = await prisma.appointment.findFirst({
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

function normalizeTime(value: string): string {
  const match = value.match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Fecha u hora inválida.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Fecha u hora inválida.");
  }

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

export async function prepareAppointment(
  values: AppointmentFormValues,
  excludeAppointmentId?: string
) {
  const service = await prisma.service.findUnique({
    where: {
      id: values.serviceId,
    },

    select: {
      id: true,
      active: true,
      durationMinutes: true,
    },
  });

  const settings = await prisma.settings.findFirst({
    select: {
      openingTime: true,
      closingTime: true,
      slotIntervalMinutes: true,
      appointmentBufferMinutes: true,
      timezone: true,
      businessDays: true,
    },
  });

  if (!service) {
    throw new Error("Servicio no encontrado.");
  }

  if (!service.active) {
    throw new Error(
      "El servicio seleccionado ya no está disponible."
    );
  }

  if (!settings) {
    throw new Error(
      "La configuración de la clínica no existe."
    );
  }

  const timezone =
    settings.timezone || "America/Mexico_City";

  const time = normalizeTime(values.time);

  /**
   * Construimos el instante usando explícitamente el timezone
   * de la clínica.
   *
   * Esto evita depender del timezone de Node/servidor.
   */
  const startAt = buildZonedDate(
    values.date,
    time,
    timezone
  );

  if (Number.isNaN(startAt.getTime())) {
    throw new Error("Fecha u hora inválida.");
  }

  if (startAt <= new Date()) {
    throw new Error("Ese horario ya pasó.");
  }

  const endAt = new Date(
    startAt.getTime() +
      service.durationMinutes * 60_000
  );

  /**
   * Obtenemos las citas del día completo en timezone de clínica.
   */
  const dayStart = buildZonedDate(
    values.date,
    "00:00",
    timezone
  );

  const dayEnd = buildZonedDate(
    values.date,
    "23:59",
    timezone
  );

  if (
    Number.isNaN(dayStart.getTime()) ||
    Number.isNaN(dayEnd.getTime())
  ) {
    throw new Error("Fecha inválida.");
  }

  const appointments =
    await prisma.appointment.findMany({
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
          lt: new Date(
            dayEnd.getTime() + 59_999
          ),
        },

        endAt: {
          gt: dayStart,
        },
      },
    });

  /**
   * MISMO motor que usa el frontend.
   *
   * Si el horario no aparece aquí, el backend tampoco lo permite.
   */
  const availableSlots = getAvailableSlots({
    date: values.date,
    timezone,
    appointments,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    interval: settings.slotIntervalMinutes,
    duration: service.durationMinutes,
    buffer: settings.appointmentBufferMinutes,
    businessDays: settings.businessDays,
  });

  const requestedIsAvailable =
    availableSlots.some(
      (slot) =>
        slot.getTime() === startAt.getTime()
    );

  if (!requestedIsAvailable) {
    throw new Error(
      "Ese horario no está disponible. Selecciona uno de los horarios disponibles."
    );
  }

  /**
   * Segunda comprobación específica de solapamiento.
   *
   * Esto sigue siendo necesario porque la disponibilidad mostrada
   * al usuario puede quedar obsoleta mientras otro usuario reserva.
   */
  const available = await isSlotAvailable(
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
    email: values.email?.trim() || null,
    petName: values.petName.trim(),
    serviceId: service.id,
    startAt,
    endAt,
    notes: values.notes?.trim() || null,
    status: values.status,
  };
}