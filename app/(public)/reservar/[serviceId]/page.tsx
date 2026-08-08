import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

import {
  BookingSettings,
  ServiceDTO,
} from "@/types/appointment";

import  {BookingPage} from "./components/booking-page";

interface Props {
  params: Promise<{
    serviceId: string;
  }>;
}

export default async function ReserveServicePage({
  params,
}: Props) {
  const { serviceId } = await params;

  const [rawService, settings] =
    await Promise.all([
      prisma.service.findUnique({
        where: {
          id: serviceId,
          active: true,
        },
      }),

      prisma.settings.findFirst(),
    ]);

  if (!rawService || !settings) {
    notFound();
  }

  const service = serialize<
    typeof rawService,
    ServiceDTO
  >(rawService);

  const bookingSettings: BookingSettings = {
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    slotIntervalMinutes:
      settings.slotIntervalMinutes,
    appointmentBufferMinutes:
      settings.appointmentBufferMinutes,
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <BookingPage
        service={service}
        settings={bookingSettings}
      />
    </main>
  );
}