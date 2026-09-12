"use server";

import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  getCalendarList,
} from "@/lib/google/calendar";

import {
  isGoogleInvalidGrant,
} from "@/lib/google/errors";

/*
 * =========================================================
 * AUTH
 * =========================================================
 */

async function requireAuth() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
}

/*
 * =========================================================
 * TIPOS GOOGLE CALENDAR
 * =========================================================
 */

type CalendarOption = {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
};

type GoogleActionSuccess = {
  success: true;
};

type GoogleActionError = {
  success: false;
  error: string;
  code?: string;
};

/*
 * =========================================================
 * TIPOS BUSINESS DAYS
 * =========================================================
 */

type BlockedRange = {
  start: string;
  end: string;
};

type DaySchedule = {
  enabled: boolean;
  openingTime?: string;
  closingTime?: string;
  blockedRanges?: BlockedRange[];
};

type BusinessDaysConfig = {
  weekly?: Record<string, DaySchedule>;
  exceptions?: Record<string, DaySchedule>;
};

/*
 * =========================================================
 * OBTENER CALENDARIOS
 * =========================================================
 */

export async function getGoogleCalendarsAction(): Promise<
  | {
      success: true;
      calendars: CalendarOption[];
    }
  | {
      success: false;
      calendars: [];
      error: string;
      code?: string;
    }
> {
  try {
    await requireAuth();

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        calendars: [],
        error:
          "No existe la configuración de la clínica.",
      };
    }

    if (!settings.googleRefreshToken) {
      return {
        success: false,
        calendars: [],
        error:
          "Google Calendar no está conectado.",
        code:
          "GOOGLE_REAUTH_REQUIRED",
      };
    }

    try {
      const calendars =
        await getCalendarList(
          settings.googleRefreshToken
        );

      return {
        success: true,
        calendars,
      };
    } catch (error) {
      console.error(
        "[getGoogleCalendarsAction] error:",
        error
      );

      if (
        isGoogleInvalidGrant(error)
      ) {
        await prisma.settings.update({
          where: {
            id: settings.id,
          },

          data: {
            googleRefreshToken:
              null,

            googleCalendarId:
              null,
          },
        });

        return {
          success: false,

          calendars: [],

          code:
            "GOOGLE_REAUTH_REQUIRED",

          error:
            "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
        };
      }

      return {
        success: false,

        calendars: [],

        error:
          "No fue posible obtener los calendarios.",
      };
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        calendars: [],
        error:
          "No autorizado.",
      };
    }

    console.error(
      "[getGoogleCalendarsAction] error:",
      error
    );

    return {
      success: false,
      calendars: [],
      error:
        "No fue posible obtener los calendarios.",
    };
  }
}

/*
 * =========================================================
 * SELECCIONAR CALENDARIO
 * =========================================================
 */

export async function selectGoogleCalendarAction(
  calendarId: string
): Promise<
  GoogleActionSuccess |
  GoogleActionError
> {
  try {
    await requireAuth();

    if (!calendarId.trim()) {
      return {
        success: false,
        error:
          "Selecciona un calendario.",
      };
    }

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        error:
          "No existe la configuración de la clínica.",
      };
    }

    if (!settings.googleRefreshToken) {
      return {
        success: false,
        error:
          "Google Calendar no está conectado.",
        code:
          "GOOGLE_REAUTH_REQUIRED",
      };
    }

    try {
      await prisma.settings.update({
        where: {
          id: settings.id,
        },

        data: {
          googleCalendarId:
            calendarId,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "[selectGoogleCalendarAction] error:",
        error
      );

      if (
        isGoogleInvalidGrant(error)
      ) {
        await prisma.settings.update({
          where: {
            id: settings.id,
          },

          data: {
            googleRefreshToken:
              null,

            googleCalendarId:
              null,
          },
        });

        return {
          success: false,

          code:
            "GOOGLE_REAUTH_REQUIRED",

          error:
            "La conexión con Google Calendar expiró o fue revocada. Vuelve a conectar Google Calendar.",
        };
      }

      return {
        success: false,

        error:
          "No fue posible guardar el calendario.",
      };
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        error:
          "No autorizado.",
      };
    }

    console.error(
      "[selectGoogleCalendarAction] error:",
      error
    );

    return {
      success: false,
      error:
        "No fue posible guardar el calendario.",
    };
  }
}

/*
 * =========================================================
 * GUARDAR DÍAS DE ATENCIÓN
 * =========================================================
 */

export async function updateWeeklyScheduleAction(
  weekly: Record<
    string,
    {
      enabled: boolean;
    }
  >
) {
  try {
    await requireAuth();

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        message:
          "No existe la configuración de la clínica.",
      };
    }

    const currentBusinessDays =
      settings.businessDays;

    let currentConfig: BusinessDaysConfig = {};

    if (
      currentBusinessDays &&
      typeof currentBusinessDays === "object" &&
      !Array.isArray(currentBusinessDays)
    ) {
      currentConfig =
        currentBusinessDays as BusinessDaysConfig;
    }

    const currentWeekly =
      currentConfig.weekly ?? {};

    const updatedWeekly: Record<
      string,
      DaySchedule
    > = {};

    for (
      let day = 0;
      day <= 6;
      day++
    ) {
      const key = String(day);

      const currentDay =
        currentWeekly[key];

      const requestedDay =
        weekly[key];

      updatedWeekly[key] = {
        enabled:
          requestedDay?.enabled ??
          currentDay?.enabled ??
          true,

        openingTime:
          currentDay?.openingTime ??
          settings.openingTime,

        closingTime:
          currentDay?.closingTime ??
          settings.closingTime,

        blockedRanges:
          currentDay?.blockedRanges ??
          [],
      };
    }

    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        businessDays: {
          weekly: updatedWeekly,

          exceptions:
            currentConfig.exceptions ??
            {},
        },
      },
    });

    return {
      success: true,
      message:
        "Días de atención guardados correctamente.",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No autorizado.",
      };
    }

    console.error(
      "[updateWeeklyScheduleAction] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible guardar los días de atención.",
    };
  }
}

/*
 * =========================================================
 * CERRAR PERÍODO
 * =========================================================
 */

export async function closeDateRangeAction(
  startDate: string,
  endDate: string
) {
  try {
    await requireAuth();

    if (!startDate || !endDate) {
      return {
        success: false,
        message:
          "Selecciona una fecha de inicio y una fecha de fin.",
      };
    }

    const start =
      new Date(`${startDate}T00:00:00`);

    const end =
      new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return {
        success: false,
        message:
          "Las fechas seleccionadas no son válidas.",
      };
    }

    if (start > end) {
      return {
        success: false,
        message:
          "La fecha de inicio no puede ser posterior a la fecha de fin.",
      };
    }

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        message:
          "No existe la configuración de la clínica.",
      };
    }

    const currentBusinessDays =
      settings.businessDays;

    let currentConfig: BusinessDaysConfig = {};

    if (
      currentBusinessDays &&
      typeof currentBusinessDays === "object" &&
      !Array.isArray(currentBusinessDays)
    ) {
      currentConfig =
        currentBusinessDays as BusinessDaysConfig;
    }

    const exceptions = {
      ...(currentConfig.exceptions ?? {}),
    };

    const current =
      new Date(start);

    while (current <= end) {
      const dateKey = [
        current.getFullYear(),
        String(
          current.getMonth() + 1
        ).padStart(2, "0"),
        String(
          current.getDate()
        ).padStart(2, "0"),
      ].join("-");

      exceptions[dateKey] = {
        enabled: false,
      };

      current.setDate(
        current.getDate() + 1
      );
    }

    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        businessDays: {
          weekly:
            currentConfig.weekly ??
            {},

          exceptions,
        },
      },
    });

    return {
      success: true,
      message:
        "Período cerrado correctamente.",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No autorizado.",
      };
    }

    console.error(
      "[closeDateRangeAction] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible cerrar el período.",
    };
  }
}

/*
 * =========================================================
 * ABRIR FECHA ESPECÍFICA
 * =========================================================
 */

export async function reopenDateAction(
  date: string
) {
  try {
    await requireAuth();

    if (!date) {
      return {
        success: false,
        message:
          "Selecciona una fecha.",
      };
    }

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      return {
        success: false,
        message:
          "No existe la configuración de la clínica.",
      };
    }

    const currentBusinessDays =
      settings.businessDays;

    let currentConfig: BusinessDaysConfig = {};

    if (
      currentBusinessDays &&
      typeof currentBusinessDays === "object" &&
      !Array.isArray(currentBusinessDays)
    ) {
      currentConfig =
        currentBusinessDays as BusinessDaysConfig;
    }

    const exceptions = {
      ...(currentConfig.exceptions ?? {}),
    };

    delete exceptions[date];

    await prisma.settings.update({
      where: {
        id: settings.id,
      },

      data: {
        businessDays: {
          weekly:
            currentConfig.weekly ??
            {},

          exceptions,
        },
      },
    });

    return {
      success: true,
      message:
        "Fecha reabierta correctamente.",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return {
        success: false,
        message:
          "No autorizado.",
      };
    }

    console.error(
      "[reopenDateAction] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible reabrir la fecha.",
    };
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "No autorizado.",
      };
    }

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return {
        success: false,
        message:
          "Completa todos los campos.",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message:
          "Las nuevas contraseñas no coinciden.",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message:
          "La nueva contraseña debe tener al menos 8 caracteres.",
      };
    }

    if (
      currentPassword === newPassword
    ) {
      return {
        success: false,
        message:
          "La nueva contraseña debe ser diferente a la actual.",
      };
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (!user) {
      return {
        success: false,
        message:
          "El usuario no existe.",
      };
    }

    const currentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

    if (!currentPasswordValid) {
      return {
        success: false,
        message:
          "La contraseña actual es incorrecta.",
      };
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        passwordHash,
      },
    });

    return {
      success: true,
      message:
        "Contraseña actualizada correctamente.",
    };
  } catch (error) {
    console.error(
      "[changePasswordAction] error:",
      error
    );

    return {
      success: false,
      message:
        "No fue posible cambiar la contraseña.",
    };
  }
}