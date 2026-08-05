"use server";

import { prisma } from "@/lib/prisma";

export async function getAppointments() {
  return await prisma.appointment.findMany({
    include: {
      service: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });
}

