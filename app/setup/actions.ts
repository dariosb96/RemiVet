"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MIN_PASSWORD_LENGTH = 8;

const DEFAULT_CLINIC_NAME =
  "Clínica Veterinaria";

const DEFAULT_OPENING_TIME = "09:00";

const DEFAULT_CLOSING_TIME = "18:00";

const DEFAULT_SLOT_INTERVAL_MINUTES = 15;

const DEFAULT_APPOINTMENT_BUFFER_MINUTES = 0;

const DEFAULT_TIMEZONE =
  "America/Mexico_City";

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function getDefaultBusinessDays() {
  return {
    weekly: {
      "0": {
        enabled: false,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "1": {
        enabled: true,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "2": {
        enabled: true,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "3": {
        enabled: true,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "4": {
        enabled: true,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "5": {
        enabled: true,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },

      "6": {
        enabled: false,
        openingTime:
          DEFAULT_OPENING_TIME,
        closingTime:
          DEFAULT_CLOSING_TIME,
        blockedRanges: [],
      },
    },

    exceptions: {},
  };
}

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

  if (!isValidEmail(email)) {
    return {
      success: false,
      message:
        "Introduce un email válido.",
    };
  }

  if (
    password.length <
    MIN_PASSWORD_LENGTH
  ) {
    return {
      success: false,
      message:
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
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
   * User + Settings se crean dentro de la misma
   * transacción.
   *
   * Si cualquiera falla, ninguno queda creado.
   */

  try {
    await prisma.$transaction(
      async (tx) => {
        /*
         * =====================================================
         * COMPROBAR QUE SEA LA PRIMERA CUENTA
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
         * CREAR SETTINGS
         * =====================================================
         */

        await tx.settings.create({
          data: {
            clinicName:
              DEFAULT_CLINIC_NAME,

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

            businessDays:
              getDefaultBusinessDays(),
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
     * EMAIL DUPLICADO
     * =========================================================
     */

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message:
          "Ese email ya está registrado.",
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
   * IMPORTANTE
   * =========================================================
   *
   * No hacemos redirect aquí.
   *
   * La cuenta acaba de crearse pero todavía necesitamos
   * establecer la sesión de NextAuth.
   *
   * SetupForm hará:
   *
   * createInitialAdmin()
   *       ↓
   * signIn("credentials")
   *       ↓
   * /configuracion
   */

  return {
    success: true,
  };
}