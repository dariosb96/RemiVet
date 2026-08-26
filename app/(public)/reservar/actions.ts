"use server";

import { parse } from "date-fns";
import {
  fromZonedTime,
  formatInTimeZone,
} from "date-fns-tz";

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

    /**
     * =======================================================
     * TIMEZONE DE LA CLÍNICA
     * =======================================================
     */

    const timezone =
      settings.timezone ||
      "America/Mexico_City";

    /**
     * =======================================================
     * FECHA SELECCIONADA
     * =======================================================
     */

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

    /**
     * =======================================================
     * RANGO DEL DÍA EN EL TIMEZONE DE LA CLÍNICA
     * =======================================================
     */

    const dayStart =
      fromZonedTime(
        `${date}T00:00:00`,
        timezone
      );

    const dayEnd =
      fromZonedTime(
        `${date}T23:59:59.999`,
        timezone
      );

    /**
     * Para la lógica de disponibilidad usamos una fecha
     * cuyos componentes representan el día local de la clínica.
     */

    selectedDate.setHours(
      0,
      0,
      0,
      0
    );

    /**
     * =======================================================
     * OBTENER CITAS EXISTENTES
     * =======================================================
     */

    const appointments =
      await prisma.appointment.findMany({
        where: {
          startAt: {
            lt: dayEnd,
          },

          endAt: {
            gt: dayStart,
          },

          status: {
            not: "CANCELLED",
          },
        },

        orderBy: {
          startAt: "asc",
        },
      });

    /**
     * =======================================================
     * GENERAR HORARIOS
     * =======================================================
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

    /**
     * =======================================================
     * FILTRAR HORARIOS PASADOS
     * =======================================================
     */

    const now = new Date();

    const todayInClinicTimezone =
      formatInTimeZone(
        now,
        timezone,
        "yyyy-MM-dd"
      );

    const isToday =
      date ===
      todayInClinicTimezone;

    const filteredSlots =
      isToday
        ? slots.filter(
            (slot) => {
              /**
               * El slot generado representa una hora
               * local de la clínica.
               *
               * Lo convertimos a un instante real
               * usando el timezone de la clínica.
               */

              const localSlot =
                formatInTimeZone(
                  slot,
                  "UTC",
                  "yyyy-MM-dd'T'HH:mm:ss"
                );

              const slotInClinicTimezone =
                fromZonedTime(
                  localSlot,
                  timezone
                );

              return (
                slotInClinicTimezone.getTime() >
                now.getTime()
              );
            }
          )
        : slots;

    /**
     * =======================================================
     * LOG
     * =======================================================
     */

    console.log(
      "[PUBLIC AVAILABILITY]",
      {
        serviceId,
        date,
        timezone,

        now:
          now.toISOString(),

        todayInClinicTimezone,

        isToday,

        totalSlots:
          slots.length,

        availableSlots:
          filteredSlots.length,
      }
    );

    /**
     * =======================================================
     * DEVOLVER HORARIOS
     * =======================================================
     *
     * IMPORTANTE:
     *
     * Cada horario se devuelve como ISO UTC,
     * pero representa la hora local configurada
     * por la clínica.
     */

    return {
      success: true,

      slots:
        filteredSlots.map(
          (slot) => {
            const localTime =
              formatInTimeZone(
                slot,
                "UTC",
                "yyyy-MM-dd'T'HH:mm:ss"
              );

            const zonedDate =
              fromZonedTime(
                localTime,
                timezone
              );

            return zonedDate.toISOString();
          }
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
    /**
     * =======================================================
     * VALIDACIÓN BÁSICA
     * =======================================================
     */

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

    /**
     * =======================================================
     * VALIDAR STARTAT
     * =======================================================
     */

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

    /**
     * =======================================================
     * VALIDAR QUE EL HORARIO NO HAYA PASADO
     * =======================================================
     */

    if (
      start.getTime() <=
      Date.now()
    ) {
      return {
        success: false,
        message:
          "El horario seleccionado ya pasó. Selecciona otro horario.",
      };
    }

    /**
     * =======================================================
     * OBTENER SERVICIO
     * =======================================================
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

    /**
     * =======================================================
     * OBTENER CONFIGURACIÓN
     * =======================================================
     */

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        message:
          "La configuración de la clínica no está disponible.",
      };
    }

    const timezone =
      settings.timezone ||
      "America/Mexico_City";

    /**
     * =======================================================
     * CONVERTIR EL INSTANTE A FECHA/HORA LOCAL
     * =======================================================
     *
     * Aquí está la corrección importante.
     *
     * Si el usuario seleccionó:
     *
     * 15:00 México
     *
     * obtenemos:
     *
     * date = 2026-08-21
     * time = 15:00
     *
     * independientemente de que el servidor esté en UTC.
     */

    const date =
      formatInTimeZone(
        start,
        timezone,
        "yyyy-MM-dd"
      );

    const time =
      formatInTimeZone(
        start,
        timezone,
        "HH:mm"
      );

    /**
     * =======================================================
     * LOG
     * =======================================================
     */

    console.log(
      "[PUBLIC BOOKING] Sending appointment:",
      {
        ownerName:
          values.ownerName,

        phone:
          values.phone,

        email:
          values.email ?? "",

        petName:
          values.petName,

        serviceId:
          values.serviceId,

        startAt:
          values.startAt,

        timezone,

        convertedDate:
          date,

        convertedTime:
          time,
      }
    );

    /**
     * =======================================================
     * CREAR CITA
     * =======================================================
     */

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

        status:
          "PENDING",
      });

    /**
     * =======================================================
     * LOG
     * =======================================================
     */

    console.log(
      "[PUBLIC BOOKING] createAppointment result:",
      result
    );

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