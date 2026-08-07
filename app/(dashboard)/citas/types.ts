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
}

export interface AppointmentDTO {
  id: string;
  ownerName: string;
  phone: string;
  email: string | null;
  petName: string;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  status: AppointmentStatus;
  serviceId: string;

  service: {
    id: string;
    name: string;
  };
}