"use server";

import { prisma } from "@/lib/prisma";

export {
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/appointments/actions";

/**
 * =========================================================
 * OBTENER CITAS
 * =========================================================
 */

export async function getAppointments() {
  return prisma.appointment.findMany({
    include: {
      service: true,
    },

    orderBy: {
      startAt: "asc",
    },
  });
}

/**
 * =========================================================
 * OBTENER CITA
 * =========================================================
 */

export async function getAppointment(
  id: string
) {
  return prisma.appointment.findUnique({
    where: {
      id,
    },

    include: {
      service: true,
    },
  });
}