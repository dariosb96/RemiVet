"use server";

import { addMinutes, parse } from "date-fns";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "./lib/availability";

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
 * =========================================================
 * OBTENER HORARIOS DISPONIBLES
 * =========================================================
 */
export async function getAvailableSlotsAction({
  serviceId,
  date,
}: GetSlotsInput) {
  console.log(
  "🔥🔥🔥 getAvailableSlotsAction EJECUTADA",
  {
    serviceId,
    date,
  }
);
  try {
    if (!serviceId || !date) {
      return {
        success: false,
        slots: [],
        message:
          "Faltan datos para consultar disponibilidad.",
      };
    }

    /*
     * Buscar servicio y configuración.
     */
    const [service, settings] =
      await Promise.all([
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

    /*
     * Convertir yyyy-MM-dd a Date.
     *
     * IMPORTANTE:
     * No usamos la hora actual aquí.
     *
     * Primero necesitamos generar correctamente
     * los horarios del día seleccionado.
     */
    const selectedDate = parse(
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

    /*
     * Normalizamos la fecha al inicio del día.
     */
    selectedDate.setHours(
      0,
      0,
      0,
      0
    );

    /*
     * Rango completo del día.
     */
    const start = new Date(
      selectedDate
    );

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end = new Date(
      selectedDate
    );

    end.setHours(
      23,
      59,
      59,
      999
    );

    /*
     * Obtener citas existentes que
     * puedan interferir con el día.
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
     * DEBUG
     *
     * Esto nos permitirá saber exactamente
     * qué está llegando a availability.ts.
     */
    console.log(
      "[getAvailableSlotsAction]",
      {
        date,
        selectedDate:
          selectedDate.toString(),

        serviceId,

        service: {
          name: service.name,
          durationMinutes:
            service.durationMinutes,
        },

        settings: {
          openingTime:
            settings.openingTime,

          closingTime:
            settings.closingTime,

          slotIntervalMinutes:
            settings.slotIntervalMinutes,

          appointmentBufferMinutes:
            settings.appointmentBufferMinutes,

          businessDays:
            settings.businessDays,
        },

        appointments:
          appointments.length,
      }
    );

    /*
     * UNA SOLA FUENTE DE VERDAD
     * PARA GENERAR LOS HORARIOS.
     */
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

    /*
     * IMPORTANTE:
     *
     * Por ahora NO filtramos horarios según
     * la hora actual.
     *
     * Esto elimina temporalmente cualquier
     * problema causado por timezone/UTC.
     */
    const availableSlots = slots;

    console.log(
      "[getAvailableSlotsAction] resultado:",
      {
        generated:
          slots.length,

        available:
          availableSlots.length,

        slots:
          availableSlots.map(
            (slot) =>
              slot.toString()
          ),
      }
    );

    return {
      success: true,

      slots:
        availableSlots.map(
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

    /*
     * Validación básica.
     */
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

    /*
     * Convertir el horario seleccionado.
     */
    const start =
      new Date(startAt);

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
     * Obtener servicio y configuración
     * nuevamente en el servidor.
     *
     * Nunca confiamos únicamente en
     * los datos enviados por el navegador.
     */
    const [service, settings] =
      await Promise.all([
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
        message:
          "El servicio seleccionado ya no está disponible.",
      };
    }

    if (!settings) {
      return {
        success: false,
        message:
          "La configuración de la clínica no está disponible.",
      };
    }

    /*
     * Calcular final de la cita.
     */
    const end =
      addMinutes(
        start,
        service.durationMinutes
      );

    /*
     * Comprobar conflicto.
     *
     * No permitimos que dos citas
     * se traslapen.
     */
    const conflict =
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

    if (conflict) {
      return {
        success: false,
        message:
          "Ese horario acaba de ser ocupado. Selecciona otro horario.",
      };
    }

    /*
     * Crear la cita.
     */
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

    console.log(
      "[createPublicAppointment] cita creada:",
      {
        id: appointment.id,
        serviceId:
          appointment.serviceId,
        startAt:
          appointment.startAt,
        endAt:
          appointment.endAt,
      }
    );

    return {
      success: true,

      appointmentId:
        appointment.id,
    };
  } catch (error) {
    console.error(
      "[createPublicAppointment] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible reservar la cita. Intenta nuevamente.",
    };
  }
}