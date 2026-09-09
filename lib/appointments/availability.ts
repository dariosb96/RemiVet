import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { Appointment } from "@prisma/client";

export interface BlockedRange {
  start: string;
  end: string;
}

export interface ExternalBlockedRange {
  start: Date;
  end: Date;
  eventId?: string;
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

export interface AvailableSlotsOptions {
  /**
   * Fecha calendario de la clínica.
   * Formato: yyyy-MM-dd
   */
  date: string;

  /**
   * Timezone de la clínica.
   */
  timezone: string;

  /**
   * Citas almacenadas en PostgreSQL.
   */
  appointments: Appointment[];

  /**
   * Eventos ocupados provenientes de Google Calendar.
   */
  externalBlockedRanges?: ExternalBlockedRange[];

  openingTime: string;
  closingTime: string;

  interval: number;
  duration: number;
  buffer: number;

  businessDays?: unknown;
}

function normalizeTime(
  value: string
): string | null {
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
    hours > 23
  ) {
    return null;
  }

  if (
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function isValidDateString(
  date: string
): boolean {
  if (typeof date !== "string") {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    return false;
  }

  const parsed =
    new Date(
      `${date}T12:00:00.000Z`
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return false;
  }

  return (
    parsed.getUTCFullYear() ===
      Number(date.slice(0, 4)) &&
    parsed.getUTCMonth() + 1 ===
      Number(date.slice(5, 7)) &&
    parsed.getUTCDate() ===
      Number(date.slice(8, 10))
  );
}

/**
 * Obtiene el día de la semana sin depender
 * del timezone del servidor.
 */
function getDayOfWeek(
  date: string
): number {
  return new Date(
    `${date}T12:00:00.000Z`
  ).getUTCDay();
}

function getDateKey(
  date: string
): string {
  return date;
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
  date: string,
  businessDays: unknown,
  defaultOpeningTime: string,
  defaultClosingTime: string
): DaySchedule {
  const config =
    normalizeBusinessDays(
      businessDays
    );

  const dayOfWeek =
    getDayOfWeek(date);

  const dayKey =
    String(dayOfWeek);

  let weeklySchedule =
    config.weekly?.[dayKey];

  /*
   * Compatibilidad con estructura antigua.
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

    const name =
      names[dayOfWeek];

    const configRecord =
      config as unknown as Record<
        string,
        unknown
      >;

    const namedSchedule =
      configRecord[name];

    if (
      namedSchedule &&
      typeof namedSchedule ===
        "object" &&
      !Array.isArray(
        namedSchedule
      )
    ) {
      weeklySchedule =
        namedSchedule as DaySchedule;
    }

    if (
      typeof namedSchedule ===
      "boolean"
    ) {
      weeklySchedule = {
        enabled:
          namedSchedule,
        openingTime:
          defaultOpeningTime,
        closingTime:
          defaultClosingTime,
      };
    }
  }

  /*
   * Si no existe configuración,
   * mantenemos el comportamiento anterior:
   * abierto.
   */
  const baseSchedule: DaySchedule =
    weeklySchedule ?? {
      enabled: true,
      openingTime:
        defaultOpeningTime,
      closingTime:
        defaultClosingTime,
      blockedRanges: [],
    };

  const schedule: DaySchedule =
    {
      enabled:
        baseSchedule.enabled !==
        false,

      openingTime:
        baseSchedule.openingTime ??
        defaultOpeningTime,

      closingTime:
        baseSchedule.closingTime ??
        defaultClosingTime,

      blockedRanges:
        baseSchedule.blockedRanges ??
        [],
    };

  const dateKey =
    getDateKey(date);

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

/**
 * Convierte fecha + hora de clínica
 * a un instante real.
 */
export function buildZonedDate(
  date: string,
  time: string,
  timezone: string
): Date {
  const normalized =
    normalizeTime(time);

  if (!normalized) {
    return new Date(NaN);
  }

  return fromZonedTime(
    `${date}T${normalized}:00`,
    timezone
  );
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
  timezone,
  openingTime,
  closingTime,
  interval,
  duration,
  buffer,
}: {
  date: string;
  timezone: string;
  openingTime: string;
  closingTime: string;
  interval: number;
  duration: number;
  buffer: number;
}): Date[] {
  const normalizedOpening =
    normalizeTime(
      openingTime
    );

  const normalizedClosing =
    normalizeTime(
      closingTime
    );

  if (
    !normalizedOpening ||
    !normalizedClosing
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

  const opening =
    buildZonedDate(
      date,
      normalizedOpening,
      timezone
    );

  const closing =
    buildZonedDate(
      date,
      normalizedClosing,
      timezone
    );

  if (
    Number.isNaN(
      opening.getTime()
    )
  ) {
    return [];
  }

  if (
    Number.isNaN(
      closing.getTime()
    )
  ) {
    return [];
  }

  if (closing <= opening) {
    return [];
  }

  const slots: Date[] = [];

  let current =
    new Date(opening);

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

    /*
     * La cita completa, incluyendo buffer,
     * debe terminar antes o exactamente al cierre.
     */
    if (
      occupiedUntil >
      closing
    ) {
      break;
    }

    slots.push(
      new Date(current)
    );

    current = addMinutes(
      current,
      interval
    );
  }

  return slots;
}

/**
 * Elimina slots que chocan con
 * cierres configurados en RemiVet.
 */
function removeBlockedRanges(
  slots: Date[],
  blockedRanges: BlockedRange[],
  date: string,
  timezone: string,
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
            buildZonedDate(
              date,
              range.start,
              timezone
            );

          const blockedEnd =
            buildZonedDate(
              date,
              range.end,
              timezone
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

          if (
            blockedEnd <=
            blockedStart
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

/**
 * Elimina slots ocupados por citas
 * existentes en PostgreSQL.
 */
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

/**
 * Elimina slots ocupados directamente
 * en Google Calendar.
 */
function removeExternalOccupiedSlots(
  slots: Date[],
  blockedRanges: ExternalBlockedRange[],
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
          if (
            Number.isNaN(
              range.start.getTime()
            ) ||
            Number.isNaN(
              range.end.getTime()
            )
          ) {
            return false;
          }

          if (
            range.end <=
            range.start
          ) {
            return false;
          }

          return overlaps(
            slot,
            occupiedUntil,
            range.start,
            range.end
          );
        }
      );
    }
  );
}

/**
 * =========================================================
 * OBTENER SLOTS DISPONIBLES
 * =========================================================
 *
 * La disponibilidad final es:
 *
 * Horario laboral
 *      ↓
 * Cierres / excepciones
 *      ↓
 * Citas PostgreSQL
 *      ↓
 * Eventos Google Calendar
 */
export function getAvailableSlots({
  date,
  timezone,
  appointments,
  externalBlockedRanges = [],
  openingTime,
  closingTime,
  interval,
  duration,
  buffer,
  businessDays,
}: AvailableSlotsOptions): Date[] {
  if (
    !isValidDateString(date)
  ) {
    return [];
  }

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

  const generatedSlots =
    generateTimeSlots({
      date,
      timezone,
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

  const slotsWithoutBlockedRanges =
    removeBlockedRanges(
      generatedSlots,
      schedule.blockedRanges ??
        [],
      date,
      timezone,
      duration,
      buffer
    );

  const slotsWithoutLocalAppointments =
    removeOccupiedSlots(
      slotsWithoutBlockedRanges,
      appointments,
      duration,
      buffer
    );

  const finalSlots =
    removeExternalOccupiedSlots(
      slotsWithoutLocalAppointments,
      externalBlockedRanges,
      duration,
      buffer
    );

  return finalSlots;
}