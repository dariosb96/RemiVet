import { prisma } from "@/lib/prisma";

import { AppointmentFormValues } from "../schema";


export function buildStartDate(
  date: string,
  time: string
) {
  const startAt = new Date(
    `${date}T${time}:00`
  );

  if (Number.isNaN(startAt.getTime())) {
    throw new Error(
      "Fecha u hora inválida."
    );
  }

  return startAt;
}


export function calculateEndAt(
  startAt: Date,
  durationMinutes: number
) {
  return new Date(
    startAt.getTime() +
      durationMinutes * 60_000
  );
}


export async function isSlotAvailable(
  startAt: Date,
  endAt: Date,
  excludeAppointmentId?: string
) {
  const conflict =
    await prisma.appointment.findFirst({
      where: {
        ...(excludeAppointmentId && {
          id: {
            not: excludeAppointmentId,
          },
        }),

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


export async function prepareAppointment(
  values: AppointmentFormValues,
  excludeAppointmentId?: string
) {

  const service =
    await prisma.service.findUnique({
      where:{
        id: values.serviceId,
      },

      select:{
        id:true,
        durationMinutes:true,
      },
    });


  if(!service){
    throw new Error(
      "Servicio no encontrado."
    );
  }


  const startAt =
    buildStartDate(
      values.date,
      values.time
    );


  const endAt =
    calculateEndAt(
      startAt,
      service.durationMinutes
    );


  const available =
    await isSlotAvailable(
      startAt,
      endAt,
      excludeAppointmentId
    );


  if(!available){
    throw new Error(
      "Ya existe una cita en ese horario."
    );
  }


  return {
    ownerName:
      values.ownerName,

    phone:
      values.phone,

    email:
      values.email || null,

    petName:
      values.petName,

    serviceId:
      service.id,

    startAt,
    endAt,

    notes:
      values.notes || null,

    status:
      values.status,
  };
}