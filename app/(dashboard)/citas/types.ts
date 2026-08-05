import { AppointmentStatus } from "@prisma/client";

export interface AppointmentFormValues {
  ownerName: string;
  phone: string;
  email: string;
  petName: string;

  serviceId: string;

  date: string;
  time: string;

  notes: string;

  status: AppointmentStatus;
}