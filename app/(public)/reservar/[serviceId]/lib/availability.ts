import { Appointment } from "@prisma/client";
import { addMinutes, isBefore } from "date-fns";

interface AvailableSlotsOptions {
  date: Date;
  appointments: Appointment[];
  openingTime: string;
  closingTime: string;
  interval: number;
  duration: number;
  buffer: number;
}

export function generateTimeSlots(
  date: Date,
  openingTime: string,
  closingTime: string,
  interval: number
) {
  const [openHour, openMinute] =
    openingTime.split(":").map(Number);

  const [closeHour, closeMinute] =
    closingTime.split(":").map(Number);

  const start = new Date(date);
  start.setHours(openHour, openMinute, 0, 0);

  const end = new Date(date);
  end.setHours(closeHour, closeMinute, 0, 0);

  const slots: Date[] = [];

  let current = start;

  while (isBefore(current, end)) {
    slots.push(current);
    current = addMinutes(current, interval);
  }

  return slots;
}

export function removeOccupiedSlots(
  slots: Date[],
  appointments: Appointment[],
  serviceDuration: number,
  buffer: number
) {
  return slots.filter((slot) => {
    const end = addMinutes(
      slot,
      serviceDuration + buffer
    );

    return !appointments.some(
      (appointment) =>
        slot < appointment.endAt &&
        end > appointment.startAt
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
}: AvailableSlotsOptions) {
  const slots = generateTimeSlots(
    date,
    openingTime,
    closingTime,
    interval
  );

  return removeOccupiedSlots(
    slots,
    appointments,
    duration,
    buffer
  );
}