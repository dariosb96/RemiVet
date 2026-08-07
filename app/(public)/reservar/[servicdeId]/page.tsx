import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import { getAvailableSlots } from "./lib/availability";

import { CalendarPicker } from "./components//calendar-picker";

interface Props {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function ReserveServicePage({
  params,
}: Props) {
  const { serviceId } = await params;

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
    notFound();
  }

  const today = new Date();

  const appointments =
    await prisma.appointment.findMany({
      where: {
        startAt: {
          gte: new Date(
            today.setHours(0, 0, 0, 0)
          ),
          lt: new Date(
            today.setHours(
              23,
              59,
              59,
              999
            )
          ),
        },
      },
    });

  const slots = getAvailableSlots({
    date: new Date(),
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

  return (
    <div className="container mx-auto max-w-3xl py-10">

      <CalendarPicker
        service={service}
        
      />

    </div>
  );
}