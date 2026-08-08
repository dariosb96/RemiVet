"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

import { prepareAppointment } from "./lib/appointment";
import { appointmentSchema } from "./schema";

const APPOINTMENTS_PATH = "/citas";

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

export async function createAppointment(
  values: unknown
) {
  const parsed =
    appointmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    const data =
      await prepareAppointment(
        parsed.data
      );

    await prisma.appointment.create({
      data,
    });

    /*
      TODO:
      Google Calendar

      1. Crear evento
      2. Obtener event.id
      3. Actualizar googleEventId
    */

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible crear la cita.",
    };
  }
}

export async function updateAppointment(
  id: string,
  values: unknown
) {
  const parsed =
    appointmentSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      errors:
        parsed.error.flatten()
          .fieldErrors,
    };
  }

  try {
    const exists =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!exists) {
      return {
        success: false,
        message:
          "La cita no existe.",
      };
    }

    const data =
      await prepareAppointment(
        parsed.data,
        id
      );

    await prisma.appointment.update({
      where: {
        id,
      },
      data,
    });

    /*
      TODO:
      Google Calendar

      1. Actualizar evento existente
      2. Mantener googleEventId
    */

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la cita.",
    };
  }
}

export async function deleteAppointment(
  id: string
) {
  try {
    const appointment =
      await prisma.appointment.findUnique({
        where: {
          id,
        },
        select: {
          googleEventId: true,
        },
      });

    if (!appointment) {
      return {
        success: false,
        message:
          "La cita no existe.",
      };
    }

    /*
      TODO:
      Google Calendar

      Si existe googleEventId:
      eliminar evento
    */

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    revalidatePath(
      APPOINTMENTS_PATH
    );

    return {
      success: true,
    };
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        message:
          "La cita ya no existe.",
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible eliminar la cita.",
    };
  }
}