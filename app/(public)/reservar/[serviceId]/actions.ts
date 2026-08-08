"use server";

import { parse } from "date-fns";

import { prisma } from "@/lib/prisma";

import { getAvailableSlots } from "./lib/availability";

interface GetSlotsInput {
  serviceId: string;
  date: string;
}

export async function getAvailableSlotsAction({
  serviceId,
  date,
}: GetSlotsInput) {
  const [service, settings] =
    await Promise.all([
      prisma.service.findUnique({
        where: {
          id: serviceId,
          active: true,
        },
      }),

      prisma.settings.findFirst(),
    ]);

  if (!service || !settings) {
    return {
      success: false,
      slots: [],
    };
  }

  /*
    Importante:
    No usamos new Date("2026-08-10")
    porque JavaScript lo interpreta como UTC.

    parse() mantiene la fecha en la zona
    horaria local de la aplicación.
  */
  const selectedDate = parse(
    date,
    "yyyy-MM-dd",
    new Date()
  );

  const start = new Date(selectedDate);

  start.setHours(
    0,
    0,
    0,
    0
  );

  const end = new Date(selectedDate);

  end.setHours(
    23,
    59,
    59,
    999
  );

  const appointments =
    await prisma.appointment.findMany({
      where: {
        startAt: {
          lt: end,
        },
        endAt: {
          gt: start,
        },
      },
  });

  const slots =
    getAvailableSlots({
      date: selectedDate,
      appointments,
      openingTime:
        settings.openingTime,
      closingTime:
        settings.closingTime,
      interval:
        settings.slotIntervalMinutes,
      duration:
        service.durationMinutes,
      buffer:
        settings.appointmentBufferMinutes,
    });

  return {
    success: true,

    slots: slots.map(
      (slot) => slot.toISOString()
    ),
  };
}