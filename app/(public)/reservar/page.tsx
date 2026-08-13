import { prisma } from "@/lib/prisma";

import { BookingPage } from "./components/booking-page";

export default async function ReservePage() {
  const [services, settings] = await Promise.all([
    prisma.service.findMany({
      where: {
        active: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),

    prisma.settings.findFirst(),
  ]);

  const serializedServices = services.map(
    (service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price.toNumber(),
      active: service.active,
      displayOrder: service.displayOrder,
      color: service.color,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    })
  );

  return (
    <BookingPage
      services={serializedServices}
      settings={
        settings
          ? {
              openingTime: settings.openingTime,
              closingTime: settings.closingTime,
              slotIntervalMinutes:
                settings.slotIntervalMinutes,
              appointmentBufferMinutes:
                settings.appointmentBufferMinutes,
              businessDays: settings.businessDays,
            }
          : null
      }
    />
  );
}