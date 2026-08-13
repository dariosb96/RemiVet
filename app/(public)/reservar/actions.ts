"use server";

import { addMinutes, parse } from "date-fns";

import { prisma } from "@/lib/prisma";

import { getAvailableSlots } from "./[serviceId]/lib/availability";

export interface PublicAppointmentFormValues {
  ownerName: string;
  phone: string;
  email?: string;
  petName: string;
  notes?: string;
  serviceId: string;
  startAt: string;
}

interface GetSlotsInput {
  serviceId: string;
  date: string;
}

/**
 * Consulta los horarios disponibles
 * para el flujo público.
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

    const [service, settings] = await Promise.all([
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
          "La agenda todavía no está configurada.",
      };
    }

    const selectedDate = parse(
      date,
      "yyyy-MM-dd",
      new Date()
    );

    if (Number.isNaN(selectedDate.getTime())) {
      return {
        success: false,
        slots: [],
        message:
          "La fecha seleccionada no es válida.",
      };
    }

    /*
     * No permitir fechas anteriores a hoy.
     */
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const requestedDay = new Date(
      selectedDate
    );

    requestedDay.setHours(
      0,
      0,
      0,
      0
    );

    if (requestedDay < today) {
      return {
        success: true,
        slots: [],
      };
    }

    /*
     * Rango completo del día.
     */
    const start = new Date(selectedDate);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end = new Date(selectedDate);

    end.setHours(
      23,
      59,
      59,
      999
    );

    /*
     * Citas existentes.
     *
     * Esto consulta directamente Appointment,
     * pero NO usa la lógica del dashboard.
     */
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

    /*
     * Utilizamos únicamente el algoritmo
     * de disponibilidad.
     */
    const slots = getAvailableSlots({
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

    /*
     * Si estamos consultando hoy,
     * eliminar horarios que ya pasaron.
     */
    const now = new Date();

    const availableSlots =
      slots.filter(
        (slot) => slot > now
      );

    return {
      success: true,

      slots: availableSlots.map(
        (slot) => slot.toISOString()
      ),
    };
  } catch (error) {
    console.error(
      "getAvailableSlotsAction error:",
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
 * Crea una cita desde el flujo público.
 */
export async function createPublicAppointment(
  values: PublicAppointmentFormValues
) {
  try {
    const {
      ownerName,
      phone,
      email,
      petName,
      notes,
      serviceId,
      startAt,
    } = values;

    if (
      !ownerName?.trim() ||
      !phone?.trim() ||
      !petName?.trim() ||
      !serviceId ||
      !startAt
    ) {
      return {
        success: false,
        message:
          "Completa todos los campos obligatorios.",
      };
    }

    const start = new Date(startAt);

    if (Number.isNaN(start.getTime())) {
      return {
        success: false,
        message:
          "La fecha de la cita no es válida.",
      };
    }

    /*
     * Comprobar que el servicio sigue activo.
     */
    const service =
      await prisma.service.findFirst({
        where: {
          id: serviceId,
          active: true,
        },
      });

    if (!service) {
      return {
        success: false,
        message:
          "El servicio seleccionado ya no está disponible.",
      };
    }

    const end = addMinutes(
      start,
      service.durationMinutes
    );

    /*
     * Verificación final de concurrencia.
     */
    const conflictingAppointment =
      await prisma.appointment.findFirst({
        where: {
          status: {
            not: "CANCELLED",
          },

          startAt: {
            lt: end,
          },

          endAt: {
            gt: start,
          },
        },
      });

    if (conflictingAppointment) {
      return {
        success: false,
        message:
          "Ese horario acaba de ser ocupado. Selecciona otro horario.",
      };
    }

    const appointment =
      await prisma.appointment.create({
        data: {
          serviceId,

          ownerName:
            ownerName.trim(),

          phone:
            phone.trim(),

          email:
            email?.trim() || null,

          petName:
            petName.trim(),

          startAt: start,

          endAt: end,

          status: "PENDING",

          notes:
            notes?.trim() || null,
        },
      });

    return {
      success: true,
      appointmentId:
        appointment.id,
    };
  } catch (error) {
    console.error(
      "createPublicAppointment error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible reservar la cita. Intenta nuevamente.",
    };
  }
}