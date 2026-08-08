import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

import { BookingPage } from "./components/booking-page";
import {
  ServiceDTO,
  BookingSettings,
} from "@/types/appointment";


interface Props {
  service: ServiceDTO;
  settings: BookingSettings;
}

export default async function ReserveServicePage({
  params,
}: Props) {
  const { serviceId } = await params;

  const [rawService, settings] = await Promise.all([
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

  return (
    <BookingPage
      service={service}
      settings={{
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        slotIntervalMinutes:
          settings.slotIntervalMinutes,
        appointmentBufferMinutes:
          settings.appointmentBufferMinutes,
      }}
    />
  );
}