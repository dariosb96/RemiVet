import {
  addMinutes,
  isBefore,
  isEqual,
  parse,
} from "date-fns";

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

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function parseTimeOnDate(
  date: Date,
  time: string
) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

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

  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(date.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");

  const dayOfWeek = String(
    date.getDay()
  );

  const weekly =
    config.weekly?.[dayOfWeek];

  const exception =
    config.exceptions?.[dateKey];

  const baseSchedule: DaySchedule =
    weekly ?? {
      enabled: true,
      openingTime: defaultOpeningTime,
      closingTime: defaultClosingTime,
    };

  const schedule: DaySchedule = {
    ...baseSchedule,
    openingTime:
      baseSchedule.openingTime ??
      defaultOpeningTime,
    closingTime:
      baseSchedule.closingTime ??
      defaultClosingTime,
    blockedRanges:
      baseSchedule.blockedRanges ?? [],
  };

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

export function generateTimeSlots({
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
}) {
  if (
    !isValidTime(openingTime) ||
    !isValidTime(closingTime)
  ) {
    return [];
  }

  if (
    interval <= 0 ||
    duration <= 0 ||
    buffer < 0
  ) {
    return [];
  }

  const start = parseTimeOnDate(
    date,
    openingTime
  );

  const closing = parseTimeOnDate(
    date,
    closingTime
  );

  const slots: Date[] = [];

  let current = start;

  while (true) {
    const appointmentEnd = addMinutes(
      current,
      duration
    );

    const occupiedUntil = addMinutes(
      appointmentEnd,
      buffer
    );

    if (
      occupiedUntil > closing
    ) {
      break;
    }

    slots.push(new Date(current));

    current = addMinutes(
      current,
      interval
    );

    if (
      current >= closing ||
      isEqual(current, closing)
    ) {
      break;
    }
  }

  return slots;
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return (
    startA < endB &&
    endA > startB
  );
}

function removeBlockedRanges(
  slots: Date[],
  blockedRanges: BlockedRange[],
  date: Date,
  duration: number,
  buffer: number
) {
  if (!blockedRanges.length) {
    return slots;
  }

  return slots.filter((slot) => {
    const appointmentEnd =
      addMinutes(slot, duration);

    const occupiedUntil =
      addMinutes(
        appointmentEnd,
        buffer
      );

    return !blockedRanges.some(
      (range) => {
        if (
          !isValidTime(range.start) ||
          !isValidTime(range.end)
        ) {
          return false;
        }

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

        return overlaps(
          slot,
          occupiedUntil,
          blockedStart,
          blockedEnd
        );
      }
    );
  });
}

function removeOccupiedSlots(
  slots: Date[],
  appointments: Appointment[],
  serviceDuration: number,
  buffer: number
) {
  return slots.filter((slot) => {
    const appointmentEnd =
      addMinutes(
        slot,
        serviceDuration
      );

    const occupiedUntil =
      addMinutes(
        appointmentEnd,
        buffer
      );

    return !appointments.some(
      (appointment) =>
        appointment.status !==
          "CANCELLED" &&
        overlaps(
          slot,
          occupiedUntil,
          appointment.startAt,
          appointment.endAt
        )
    );
  });
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
}: AvailableSlotsOptions) {
  const schedule =
    getDaySchedule(
      date,
      businessDays,
      openingTime,
      closingTime
    );

  if (!schedule.enabled) {
    return [];
  }

  const effectiveOpeningTime =
    schedule.openingTime ??
    openingTime;

  const effectiveClosingTime =
    schedule.closingTime ??
    closingTime;

  const generatedSlots =
    generateTimeSlots({
      date,
      openingTime:
        effectiveOpeningTime,
      closingTime:
        effectiveClosingTime,
      interval,
      duration,
      buffer,
    });

  const slotsWithoutBlockedRanges =
    removeBlockedRanges(
      generatedSlots,
      schedule.blockedRanges ?? [],
      date,
      duration,
      buffer
    );

  return removeOccupiedSlots(
    slotsWithoutBlockedRanges,
    appointments,
    duration,
    buffer
  );
}