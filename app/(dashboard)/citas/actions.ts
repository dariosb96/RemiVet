"use server";

import { prisma } from "@/lib/prisma";

import {
  createAppointment as createAppointmentAction,
  updateAppointment as updateAppointmentAction,
  deleteAppointment as deleteAppointmentAction,
  hardDeleteAppointment as hardDeleteAppointmentAction,
} from "@/lib/appointments/actions";

/**
 * =========================================================
 * CREAR CITA
 * =========================================================
 */

export async function createAppointment(
  values: unknown
) {
  return createAppointmentAction(values);
}

/**
 * =========================================================
 * ACTUALIZAR CITA
 * =========================================================
 */

export async function updateAppointment(
  id: string,
  values: unknown
) {
  return updateAppointmentAction(
    id,
    values
  );
}

/**
 * =========================================================
 * CANCELAR CITA
 * =========================================================
 */

export async function deleteAppointment(
  id: string
) {
  return deleteAppointmentAction(id);
}

/**
 * =========================================================
 * ELIMINAR CITA DEFINITIVAMENTE
 * =========================================================
 */

export async function hardDeleteAppointment(
  id: string
) {
  return hardDeleteAppointmentAction(id);
}

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