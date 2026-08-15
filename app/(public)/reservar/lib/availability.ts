import { addMinutes } from "date-fns";

import type { Appointment } from "@prisma/client";

export interface BlockedRange {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  openingTime?: string;
  closingTime?: string;
  blockedRanges?: BlockedRange[];
}

export interface BusinessDaysConfig {
  weekly?: Record<string, DaySchedule>;
  exceptions?: Record<string, DaySchedule>;
}

interface AvailableSlotsOptions {
  date: Date;
  appointments: Appointment[];
  openingTime: string;
  closingTime: string;
  interval: number;
  duration: number;
  buffer: number;
  businessDays?: unknown;
}

/**
 * Acepta:
 *
 * 09:00
 * 09:00:00
 */
function normalizeTime(value: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}`;
}

function parseTimeOnDate(
  date: Date,
  time: string
): Date {
  const normalized = normalizeTime(time);

  if (!normalized) {
    return new Date(NaN);
  }

  const [hours, minutes] =
    normalized.split(":").map(Number);

  const result = new Date(date);

  result.setHours(
    hours,
    minutes,
    0,
    0
  );

  return result;
}

function normalizeBusinessDays(
  value: unknown
): BusinessDaysConfig {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as BusinessDaysConfig;
}

function getDaySchedule(
  date: Date,
  businessDays: unknown,
  defaultOpeningTime: string,
  defaultClosingTime: string
): DaySchedule {
  const config =
    normalizeBusinessDays(businessDays);

  const dayOfWeek = date.getDay();

  const dayKey = String(dayOfWeek);

  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  let weeklySchedule =
    config.weekly?.[dayKey];

  /**
   * También soportamos:
   *
   * monday
   * tuesday
   * ...
   */
  if (!weeklySchedule) {
    const names = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const name = names[dayOfWeek];

    const namedSchedule =
      (
        config as Record<
          string,
          unknown
        >
      )[name];

    if (
      namedSchedule &&
      typeof namedSchedule === "object" &&
      !Array.isArray(namedSchedule)
    ) {
      weeklySchedule =
        namedSchedule as DaySchedule;
    }

    /**
     * También soportamos:
     *
     * monday: true
     * monday: false
     */
    if (
      typeof namedSchedule === "boolean"
    ) {
      weeklySchedule = {
        enabled: namedSchedule,
        openingTime:
          defaultOpeningTime,
        closingTime:
          defaultClosingTime,
      };
    }
  }

  /**
   * Si no existe businessDays para
   * ese día, usamos el horario general
   * de Settings.
   */
  const baseSchedule =
    weeklySchedule ?? {
      enabled: true,
      openingTime:
        defaultOpeningTime,
      closingTime:
        defaultClosingTime,
      blockedRanges: [],
    };

  const schedule: DaySchedule = {
    enabled:
      baseSchedule.enabled !== false,

    openingTime:
      baseSchedule.openingTime ??
      defaultOpeningTime,

    closingTime:
      baseSchedule.closingTime ??
      defaultClosingTime,

    blockedRanges:
      baseSchedule.blockedRanges ?? [],
  };

  /**
   * Excepciones por fecha.
   */
  const exception =
    config.exceptions?.[dateKey];

  if (exception) {
    return {
      ...schedule,
      ...exception,
      blockedRanges:
        exception.blockedRanges ??
        schedule.blockedRanges ??
        [],
    };
  }

  return schedule;
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return (
    startA < endB &&
    endA > startB
  );
}

function generateTimeSlots({
  date,
  openingTime,
  closingTime,
  interval,
  duration,
  buffer,
}: {
  date: Date;
  openingTime: string;
  closingTime: string;
  interval: number;
  duration: number;
  buffer: number;
}): Date[] {
  const normalizedOpening =
    normalizeTime(openingTime);

  const normalizedClosing =
    normalizeTime(closingTime);

  if (
    !normalizedOpening ||
    !normalizedClosing
  ) {
    console.error(
      "[availability] Horario inválido:",
      {
        openingTime,
        closingTime,
      }
    );

    return [];
  }

  if (
    interval <= 0 ||
    duration <= 0 ||
    buffer < 0
  ) {
    console.error(
      "[availability] Parámetros inválidos:",
      {
        interval,
        duration,
        buffer,
      }
    );

    return [];
  }

  const opening =
    parseTimeOnDate(
      date,
      normalizedOpening
    );

  const closing =
    parseTimeOnDate(
      date,
      normalizedClosing
    );

  if (
    Number.isNaN(opening.getTime()) ||
    Number.isNaN(closing.getTime())
  ) {
    return [];
  }

  if (closing <= opening) {
    console.error(
      "[availability] El cierre es anterior o igual a la apertura:",
      {
        openingTime,
        closingTime,
      }
    );

    return [];
  }

  const slots: Date[] = [];

  let current = new Date(opening);

  while (true) {
    const appointmentEnd =
      addMinutes(
        current,
        duration
      );

    const occupiedUntil =
      addMinutes(
        appointmentEnd,
        buffer
      );

    /**
     * La cita completa debe caber
     * dentro del horario laboral.
     */
    if (
      occupiedUntil > closing
    ) {
      break;
    }

    slots.push(
      new Date(current)
    );

    current =
      addMinutes(
        current,
        interval
      );
  }

  return slots;
}

function removeBlockedRanges(
  slots: Date[],
  blockedRanges: BlockedRange[],
  date: Date,
  duration: number,
  buffer: number
): Date[] {
  if (
    blockedRanges.length === 0
  ) {
    return slots;
  }

  return slots.filter(
    (slot) => {
      const appointmentEnd =
        addMinutes(
          slot,
          duration
        );

      const occupiedUntil =
        addMinutes(
          appointmentEnd,
          buffer
        );

      return !blockedRanges.some(
        (range) => {
          const blockedStart =
            parseTimeOnDate(
              date,
              range.start
            );

          const blockedEnd =
            parseTimeOnDate(
              date,
              range.end
            );

          if (
            Number.isNaN(
              blockedStart.getTime()
            ) ||
            Number.isNaN(
              blockedEnd.getTime()
            )
          ) {
            return false;
          }

          return overlaps(
            slot,
            occupiedUntil,
            blockedStart,
            blockedEnd
          );
        }
      );
    }
  );
}

function removeOccupiedSlots(
  slots: Date[],
  appointments: Appointment[],
  duration: number,
  buffer: number
): Date[] {
  return slots.filter(
    (slot) => {
      const appointmentEnd =
        addMinutes(
          slot,
          duration
        );

      const occupiedUntil =
        addMinutes(
          appointmentEnd,
          buffer
        );

      return !appointments.some(
        (appointment) => {
          if (
            appointment.status ===
            "CANCELLED"
          ) {
            return false;
          }

          return overlaps(
            slot,
            occupiedUntil,
            appointment.startAt,
            appointment.endAt
          );
        }
      );
    }
  );
}

export function getAvailableSlots({
  date,
  appointments,
  openingTime,
  closingTime,
  interval,
  duration,
  buffer,
  businessDays,
}: AvailableSlotsOptions): Date[] {
  const schedule =
    getDaySchedule(
      date,
      businessDays,
      openingTime,
      closingTime
    );

  console.log(
    "[availability] schedule:",
    {
      date: date.toISOString(),
      enabled: schedule.enabled,
      openingTime:
        schedule.openingTime,
      closingTime:
        schedule.closingTime,
      interval,
      duration,
      buffer,
      appointments:
        appointments.length,
    }
  );

  if (!schedule.enabled) {
    return [];
  }

  const generatedSlots =
    generateTimeSlots({
      date,
      openingTime:
        schedule.openingTime ??
        openingTime,
      closingTime:
        schedule.closingTime ??
        closingTime,
      interval,
      duration,
      buffer,
    });

  console.log(
    "[availability] generated:",
    generatedSlots.length
  );

  const slotsWithoutBlockedRanges =
    removeBlockedRanges(
      generatedSlots,
      schedule.blockedRanges ?? [],
      date,
      duration,
      buffer
    );

  const availableSlots =
    removeOccupiedSlots(
      slotsWithoutBlockedRanges,
      appointments,
      duration,
      buffer
    );

  console.log(
    "[availability] available:",
    availableSlots.length
  );

  return availableSlots;
}