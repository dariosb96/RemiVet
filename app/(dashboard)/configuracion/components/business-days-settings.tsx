"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  closeDateRangeAction,
  reopenDateAction,
  updateWeeklyScheduleAction,
} from "../actions";

import { Button } from "@/components/ui/button";

interface DaySchedule {
  enabled: boolean;
  openingTime?: string;
  closingTime?: string;
  blockedRanges?: {
    start: string;
    end: string;
  }[];
}

interface BusinessDaysConfig {
  weekly?: Record<
    string,
    DaySchedule
  >;

  exceptions?: Record<
    string,
    DaySchedule
  >;
}

interface BusinessDaysSettingsProps {
  businessDays: unknown;
}

const DAYS = [
  {
    key: "1",
    label: "Lunes",
  },
  {
    key: "2",
    label: "Martes",
  },
  {
    key: "3",
    label: "Miércoles",
  },
  {
    key: "4",
    label: "Jueves",
  },
  {
    key: "5",
    label: "Viernes",
  },
  {
    key: "6",
    label: "Sábado",
  },
  {
    key: "0",
    label: "Domingo",
  },
];

function normalizeConfig(
  value: unknown
): BusinessDaysConfig {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as BusinessDaysConfig;
}

function formatDate(
  date: string
) {
  const parsed =
    new Date(`${date}T00:00:00`);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export function BusinessDaysSettings({
  businessDays,
}: BusinessDaysSettingsProps) {
  const config =
    useMemo(
      () =>
        normalizeConfig(
          businessDays
        ),
      [businessDays]
    );

  /*
   * =========================================================
   * DÍAS SEMANALES
   * =========================================================
   *
   * IMPORTANTE:
   *
   * weekly utiliza DaySchedule, no boolean.
   *
   * Esto mantiene compatibilidad con:
   *
   * {
   *   "1": { enabled: true },
   *   "2": { enabled: false }
   * }
   *
   * y permite posteriormente agregar horarios
   * específicos o blockedRanges por día.
   */

  const [weekly, setWeekly] =
    useState<
      Record<
        string,
        DaySchedule
      >
    >(() => {
      const result: Record<
        string,
        DaySchedule
      > = {};

      for (const day of DAYS) {
        const existing =
          config.weekly?.[
            day.key
          ];

        result[day.key] = {
          enabled:
            existing?.enabled !==
            false,

          openingTime:
            existing?.openingTime,

          closingTime:
            existing?.closingTime,

          blockedRanges:
            existing?.blockedRanges ??
            [],
        };
      }

      return result;
    });

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [savingWeekly, setSavingWeekly] =
    useState(false);

  const [savingRange, setSavingRange] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState<string | null>(
      null
    );

  const exceptions =
    config.exceptions ?? {};

  const closedDates =
    Object.entries(
      exceptions
    )
      .filter(
        ([, schedule]) =>
          schedule?.enabled === false
      )
      .sort(
        ([a], [b]) =>
          a.localeCompare(b)
      );

  /*
   * =========================================================
   * GUARDAR DÍAS SEMANALES
   * =========================================================
   */

  async function handleSaveWeekly() {
    setSavingWeekly(true);
    setMessage(null);
    setError(null);

    try {
      const result =
        await updateWeeklyScheduleAction(
          weekly
        );

      if (!result.success) {
        setError(
          result.message
        );

        return;
      }

      setMessage(
        result.message
      );
    } catch (error) {
      console.error(
        "[BusinessDaysSettings] weekly error:",
        error
      );

      setError(
        "No fue posible guardar los días de atención."
      );
    } finally {
      setSavingWeekly(false);
    }
  }

  /*
   * =========================================================
   * CERRAR PERÍODO
   * =========================================================
   */

  async function handleCloseRange() {
    setMessage(null);
    setError(null);

    if (
      !startDate ||
      !endDate
    ) {
      setError(
        "Selecciona una fecha de inicio y una fecha de fin."
      );

      return;
    }

    if (
      startDate > endDate
    ) {
      setError(
        "La fecha de inicio no puede ser posterior a la fecha de fin."
      );

      return;
    }

    setSavingRange(true);

    try {
      const result =
        await closeDateRangeAction(
          startDate,
          endDate
        );

      if (!result.success) {
        setError(
          result.message
        );

        return;
      }

      setMessage(
        result.message
      );

      setStartDate("");
      setEndDate("");

      /*
       * Recargamos para obtener las excepciones
       * actualizadas desde Prisma.
       */
      window.location.reload();
    } catch (error) {
      console.error(
        "[BusinessDaysSettings] close range error:",
        error
      );

      setError(
        "No fue posible cerrar el período."
      );
    } finally {
      setSavingRange(false);
    }
  }

  /*
   * =========================================================
   * REABRIR FECHA
   * =========================================================
   */

  async function handleReopenDate(
    date: string
  ) {
    setMessage(null);
    setError(null);

    try {
      const result =
        await reopenDateAction(
          date
        );

      if (!result.success) {
        setError(
          result.message
        );

        return;
      }

      setMessage(
        result.message
      );

      window.location.reload();
    } catch (error) {
      console.error(
        "[BusinessDaysSettings] reopen date error:",
        error
      );

      setError(
        "No fue posible reabrir la fecha."
      );
    }
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-6 rounded-lg border p-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <h2 className="text-lg font-semibold">
          Días de atención
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Define qué días trabaja la clínica.
          Los días desactivados no mostrarán
          horarios disponibles para reservar.
        </p>
      </div>

      {/* =====================================================
          DÍAS SEMANALES
      ====================================================== */}

      <div className="space-y-2">
        {DAYS.map(
          (day) => {
            const enabled =
              weekly[
                day.key
              ]?.enabled ??
              true;

            return (
              <label
                key={day.key}
                className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
              >
                <span className="text-sm font-medium">
                  {day.label}
                </span>

                <input
                  type="checkbox"
                  checked={
                    enabled
                  }
                  onChange={(
                    event
                  ) => {
                    const checked =
                      event.target.checked;

                    setWeekly(
                      (current) => ({
                        ...current,

                        [day.key]: {
                          ...current[
                            day.key
                          ],

                          enabled:
                            checked,
                        },
                      })
                    );
                  }}
                  className="h-4 w-4"
                />
              </label>
            );
          }
        )}
      </div>

      <Button
        type="button"
        onClick={
          handleSaveWeekly
        }
        disabled={
          savingWeekly
        }
      >
        {savingWeekly
          ? "Guardando..."
          : "Guardar días de atención"}
      </Button>

      {/* =====================================================
          SEPARADOR
      ====================================================== */}

      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Cierres temporales
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Utiliza esta opción para vacaciones,
            días festivos, mantenimiento o cualquier
            otro período en el que la clínica permanezca
            cerrada.
          </p>
        </div>

        {/* ===================================================
            RANGO
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="close-start"
              className="text-sm font-medium"
            >
              Desde
            </label>

            <input
              id="close-start"
              type="date"
              value={
                startDate
              }
              onChange={(
                event
              ) =>
                setStartDate(
                  event.target.value
                )
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="close-end"
              className="text-sm font-medium"
            >
              Hasta
            </label>

            <input
              id="close-end"
              type="date"
              value={
                endDate
              }
              onChange={(
                event
              ) =>
                setEndDate(
                  event.target.value
                )
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={
              handleCloseRange
            }
            disabled={
              savingRange
            }
          >
            {savingRange
              ? "Cerrando..."
              : "Cerrar período"}
          </Button>
        </div>
      </div>

      {/* =====================================================
          FECHAS CERRADAS
      ====================================================== */}

      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold">
            Fechas cerradas
          </h3>
        </div>

        {closedDates.length ===
        0 ? (
          <p className="text-sm text-muted-foreground">
            No hay fechas cerradas temporalmente.
          </p>
        ) : (
          <div className="space-y-2">
            {closedDates.map(
              ([date]) => (
                <div
                  key={date}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(
                        date
                      )}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Clínica cerrada
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleReopenDate(
                        date
                      )
                    }
                  >
                    Reabrir
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          MENSAJES
      ====================================================== */}

      {message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}