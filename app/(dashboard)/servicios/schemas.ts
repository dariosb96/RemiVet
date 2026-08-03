import { z } from "zod";

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre es obligatorio.")
    .max(100, "Máximo 100 caracteres."),

  description: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .optional(),

  durationMinutes: z
    .number({
      error: "La duración es obligatoria.",
    })
    .int("Debe ser un número entero.")
    .min(5, "La duración mínima es de 5 minutos.")
    .max(480, "La duración máxima es de 480 minutos."),

  price: z
    .number({
      error: "El precio es obligatorio.",
    })
    .min(0, "El precio no puede ser negativo."),

  color: z.string().optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;