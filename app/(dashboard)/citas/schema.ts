import { AppointmentStatus } from "@prisma/client";
import { z } from "zod";

export const appointmentSchema = z.object({
  ownerName: z.string().trim().min(3),
  phone: z.string().trim().min(10),

  email: z
    .string()
    .email()
    .optional()
    .or(z.literal("")),

  petName: z.string().trim().min(2),

  serviceId: z.string().min(1),

  date: z.string(),

  time: z.string(),

  notes: z
    .string()
    .optional(),

  status: z.enum(AppointmentStatus),
});

export type AppointmentFormValues =
  z.infer<typeof appointmentSchema>;