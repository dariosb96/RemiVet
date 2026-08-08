import { AppointmentStatus } from "@prisma/client";

export interface ServiceDTO {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  displayOrder: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDTO {
  id: string;
  ownerName: string;
  phone: string;
  email: string | null;
  petName: string;
  serviceId: string;

  startAt: string;
  endAt: string;

  notes: string | null;

  status: AppointmentStatus;

  googleEventId: string | null;

  createdAt: string;
  updatedAt: string;

  service: ServiceDTO;
}

export interface BookingSettings {
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
  appointmentBufferMinutes: number;
}