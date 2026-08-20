"use server";

import { parse } from "date-fns";

import { prisma } from "@/lib/prisma";

import {
  getAvailableSlots,
} from "@/lib/appointments/availability";

import {
  createAppointment,
} from "@/lib/appointments/actions";

interface GetSlotsInput {
  serviceId: string;
  date: string;
}

/**
 * =========================================================
 * OBTENER HORARIOS DISPONIBLES
 * =========================================================
 */

export async function getAvailableSlotsAction({
  serviceId,
  date,
}: GetSlotsInput) {
  try {
    if (!serviceId || !date) {
      return {
        success: false,
        slots: [],
        message:
          "Faltan datos para consultar disponibilidad.",
      };
    }

    const [
      service,
      settings,
    ] = await Promise.all([
      prisma.service.findFirst({
        where: {
          id: serviceId,
          active: true,
        },
      }),

      prisma.settings.findFirst(),
    ]);

    if (!service) {
      return {
        success: false,
        slots: [],
        message:
          "El servicio seleccionado no está disponible.",
      };
    }

    if (!settings) {
      return {
        success: false,
        slots: [],
        message:
          "La configuración de la clínica no está disponible.",
      };
    }

    const selectedDate =
      parse(
        date,
        "yyyy-MM-dd",
        new Date()
      );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return {
        success: false,
        slots: [],
        message:
          "La fecha seleccionada no es válida.",
      };
    }

    selectedDate.setHours(
      0,
      0,
      0,
      0
    );

    const start =
      new Date(selectedDate);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(selectedDate);

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

          status: {
            not: "CANCELLED",
          },
        },

        orderBy: {
          startAt: "asc",
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

        businessDays:
          settings.businessDays,
      });

    return {
      success: true,

      slots:
        slots.map(
          (slot) =>
            slot.toISOString()
        ),
    };
  } catch (error) {
    console.error(
      "[getAvailableSlotsAction] error:",
      error
    );

    return {
      success: false,
      slots: [],
      message:
        "No fue posible consultar los horarios disponibles.",
    };
  }
}

/**
 * =========================================================
 * CREAR CITA PÚBLICA
 * =========================================================
 *
 * El formulario público utiliza:
 *
 * date + time
 *
 * mientras que el action central utiliza
 * AppointmentFormValues.
 *
 * Por eso aquí solamente adaptamos
 * los datos y delegamos.
 */

export interface PublicAppointmentFormValues {
  ownerName: string;
  phone: string;
  email?: string;
  petName: string;
  notes?: string;
  serviceId: string;
  startAt: string;
}

export async function createPublicAppointment(
  values: PublicAppointmentFormValues
) {
  try {
    if (
      !values.ownerName?.trim() ||
      !values.phone?.trim() ||
      !values.petName?.trim() ||
      !values.serviceId ||
      !values.startAt
    ) {
      return {
        success: false,
        message:
          "Completa todos los campos obligatorios.",
      };
    }

    const start =
      new Date(values.startAt);

    if (
      Number.isNaN(
        start.getTime()
      )
    ) {
      return {
        success: false,
        message:
          "La fecha de la cita no es válida.",
      };
    }

    /*
     * Obtener la duración real del servicio.
     */
    const service =
      await prisma.service.findFirst({
        where: {
          id: values.serviceId,
          active: true,
        },

        select: {
          id: true,
          durationMinutes: true,
        },
      });

    if (!service) {
      return {
        success: false,
        message:
          "El servicio seleccionado ya no está disponible.",
      };
    }

    /*
     * Convertimos startAt a los campos
     * que entiende AppointmentFormValues.
     *
     * IMPORTANTE:
     * usamos la hora local del servidor.
     */
    const date =
      [
        start.getFullYear(),
        String(
          start.getMonth() + 1
        ).padStart(2, "0"),
        String(
          start.getDate()
        ).padStart(2, "0"),
      ].join("-");

    const time =
      [
        String(
          start.getHours()
        ).padStart(2, "0"),
        String(
          start.getMinutes()
        ).padStart(2, "0"),
      ].join(":");

    const result =
      await createAppointment({
        ownerName:
          values.ownerName,

        phone:
          values.phone,

        email:
          values.email ?? "",

        petName:
          values.petName,

        notes:
          values.notes ?? "",

        serviceId:
          values.serviceId,

        date,

        time,

        status: "PENDING",
      });

    return result;
  } catch (error) {
    console.error(
      "[createPublicAppointment] error:",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "No fue posible reservar la cita.",
    };
  }
}