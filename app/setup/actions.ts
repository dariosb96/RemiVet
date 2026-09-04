"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

const DEFAULT_OPENING_TIME = "09:00";
const DEFAULT_CLOSING_TIME = "18:00";
const DEFAULT_SLOT_INTERVAL_MINUTES = 15;
const DEFAULT_APPOINTMENT_BUFFER_MINUTES = 0;
const DEFAULT_TIMEZONE = "America/Mexico_City";

export async function createInitialAdmin(
  formData: FormData
) {
  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const email = String(
    formData.get("email") ?? ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? ""
  );

  /*
   * =========================================================
   * VALIDACIÓN
   * =========================================================
   */

  if (!name || !email || !password) {
    return {
      success: false,
      message:
        "Todos los campos son obligatorios.",
    };
  }

  if (name.length < 2) {
    return {
      success: false,
      message:
        "El nombre debe tener al menos 2 caracteres.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      message:
        "El nombre es demasiado largo.",
    };
  }

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    return {
      success: false,
      message:
        "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const emailIsValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  if (!emailIsValid) {
    return {
      success: false,
      message:
        "Introduce un email válido.",
    };
  }

  /*
   * =========================================================
   * HASH
   * =========================================================
   */

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  /*
   * =========================================================
   * CREACIÓN INICIAL
   * =========================================================
   *
   * La primera cuenta y la configuración inicial
   * se crean juntas.
   *
   * Si una falla, no se guarda ninguna.
   *
   * Esto garantiza:
   *
   * User    ✅
   * Settings ✅
   *
   * o:
   *
   * User    ❌
   * Settings ❌
   */

  try {
    await prisma.$transaction(
      async (tx) => {
        /*
         * =====================================================
         * VERIFICAR QUE REALMENTE SEA EL PRIMER ADMIN
         * =====================================================
         */

        const existingUser =
          await tx.user.findFirst({
            select: {
              id: true,
            },
          });

        if (existingUser) {
          throw new Error(
            "INITIAL_ADMIN_ALREADY_EXISTS"
          );
        }

        /*
         * =====================================================
         * CREAR ADMIN
         * =====================================================
         */

        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "ADMIN",
          },
        });

        /*
         * =====================================================
         * CREAR CONFIGURACIÓN INICIAL
         * =====================================================
         *
         * Google todavía NO está conectado.
         *
         * Por eso:
         *
         * googleRefreshToken = null
         * googleCalendarId   = null
         *
         * La configuración queda preparada para que,
         * inmediatamente después del registro, el usuario
         * conecte Google Calendar desde /configuracion.
         */

        await tx.settings.create({
          data: {
            clinicName: name,

            openingTime:
              DEFAULT_OPENING_TIME,

            closingTime:
              DEFAULT_CLOSING_TIME,

            slotIntervalMinutes:
              DEFAULT_SLOT_INTERVAL_MINUTES,

            appointmentBufferMinutes:
              DEFAULT_APPOINTMENT_BUFFER_MINUTES,

            googleRefreshToken: null,

            googleCalendarId: null,

            timezone:
              DEFAULT_TIMEZONE,

            businessDays: {
              weekly: {
                "0": {
                  enabled: false,
                },

                "1": {
                  enabled: true,
                },

                "2": {
                  enabled: true,
                },

                "3": {
                  enabled: true,
                },

                "4": {
                  enabled: true,
                },

                "5": {
                  enabled: true,
                },

                "6": {
                  enabled: false,
                },
              },

              exceptions: {},
            },
          },
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    /*
     * =========================================================
     * PRIMER ADMIN YA EXISTE
     * =========================================================
     */

    if (
      error instanceof Error &&
      error.message ===
        "INITIAL_ADMIN_ALREADY_EXISTS"
    ) {
      return {
        success: false,
        message:
          "La cuenta inicial ya fue creada.",
      };
    }

    /*
     * =========================================================
     * CONCURRENCIA
     * =========================================================
     */

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        success: false,
        message:
          "La cuenta inicial ya fue creada.",
      };
    }

    /*
     * =========================================================
     * ERROR DESCONOCIDO
     * =========================================================
     */

    console.error(
      "[createInitialAdmin] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible crear la cuenta inicial.",
    };
  }

  /*
   * =========================================================
   * FLUJO POST-REGISTRO
   * =========================================================
   *
   * NO mandamos al usuario al login.
   *
   * El requisito es:
   *
   * crear cuenta
   *      ↓
   * configuración
   *      ↓
   * conectar Google Calendar
   *
   * Por eso vamos directamente a /configuracion.
   */

  redirect("/configuracion");
}