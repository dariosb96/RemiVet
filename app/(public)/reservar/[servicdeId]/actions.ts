"use server";

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
        },
      }),

      prisma.settings.findFirst(),
    ]);

  if (!service || !settings) {
    return [];
  }

  const selectedDate = new Date(date);

  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  const appointments =
    await prisma.appointment.findMany({
      where: {
        startAt: {
          gte: start,
          lt: end,
        },
      },
    });

  return getAvailableSlots({
    date: selectedDate,
    appointments,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    interval:
      settings.slotIntervalMinutes,
    duration:
      service.durationMinutes,
    buffer:
      settings.appointmentBufferMinutes,
  });
}