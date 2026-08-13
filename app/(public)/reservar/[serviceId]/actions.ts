"use server";

import { parse } from "date-fns";

import { prisma } from "@/lib/prisma";

import {
  getAvailableSlots,
} from "./lib/availability";

interface GetSlotsInput {
  serviceId: string;
  date: string;
}

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

    /*
     * ------------------------------------------------
     * SERVICIO + CONFIGURACIÓN
     * ------------------------------------------------
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
          "El servicio no está disponible.",
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
     * ------------------------------------------------
     * FECHA SELECCIONADA
     * ------------------------------------------------
     *
     * Convertimos yyyy-MM-dd a una fecha local.
     *
     * NO usamos:
     *
     * new Date("2026-08-10")
     *
     * porque JavaScript puede interpretarlo
     * como UTC.
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
     * ------------------------------------------------
     * FECHA ACTUAL
     * ------------------------------------------------
     */

    const now = new Date();

    /*
     * No permitimos reservar fechas anteriores.
     */

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const requestedDay =
      new Date(selectedDate);

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
     * ------------------------------------------------
     * RANGO DEL DÍA
     * ------------------------------------------------
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
     * ------------------------------------------------
     * CITAS EXISTENTES
     * ------------------------------------------------
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
     * ------------------------------------------------
     * GENERAR HORARIOS
     * ------------------------------------------------
     *
     * Aquí pasamos TODOS los parámetros de
     * configuración, incluyendo businessDays.
     *
     * Esto permite que availability.ts determine:
     *
     * - días activos
     * - horarios de apertura
     * - horarios de cierre
     * - excepciones
     * - bloqueos
     * - citas existentes
     * - duración del servicio
     * - buffer
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
     * ------------------------------------------------
     * SI ES HOY
     * ------------------------------------------------
     *
     * Nunca mostramos horarios que ya pasaron.
     */

    const availableSlots =
      slots.filter(
        (slot) => slot > now
      );

    /*
     * ------------------------------------------------
     * RESPUESTA
     * ------------------------------------------------
     */

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