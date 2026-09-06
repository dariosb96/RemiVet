import { z } from "zod";

export const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      3,
      "El nombre debe tener al menos 3 caracteres.",
    )
    .max(
      100,
      "Máximo 100 caracteres.",
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Máximo 500 caracteres.",
    )
    .optional(),

  durationMinutes: z
    .number({
      error: "La duración es obligatoria.",
    })
    .int(
      "Debe ser un número entero.",
    )
    .min(
      5,
      "La duración mínima es de 5 minutos.",
    )
    .max(
      480,
      "La duración máxima es de 480 minutos.",
    )
    .multipleOf(
      5,
      "La duración debe ser múltiplo de 5 minutos.",
    ),

  price: z
    .number({
      error: "El precio es obligatorio.",
    })
    .finite(
      "El precio no es válido.",
    )
    .min(
      0,
      "El precio no puede ser negativo.",
    )
    .max(
      99999999.99,
      "El precio es demasiado alto.",
    ),

  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "El color no es válido.",
    )
    .optional(),
});

export type ServiceFormData =
  z.infer<typeof serviceSchema>;