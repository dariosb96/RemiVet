"use client";

import { useEffect, useState } from "react";

import {
  getGoogleCalendarsAction,
  selectGoogleCalendarAction,
} from "../actions";

import { Button } from "@/components/ui/button";

interface CalendarOption {
  id: string;
  summary: string;
  description: string | null;
  primary: boolean;
}

interface GoogleCalendarSettingsProps {
  connected: boolean;
  selectedCalendarId: string | null;
}

export function GoogleCalendarSettings({
  connected,
  selectedCalendarId,
}: GoogleCalendarSettingsProps) {
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState(
    selectedCalendarId ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const [requiresReauth, setRequiresReauth] = useState(!connected);

  /*
   * =========================================================
   * SINCRONIZAR PROPS CON ESTADO LOCAL
   * =========================================================
   */
  useEffect(() => {
    setRequiresReauth(!connected);
    setSelectedCalendar(selectedCalendarId ?? "");

    if (!connected) {
      setCalendars([]);
    }
  }, [connected, selectedCalendarId]);

  /*
   * =========================================================
   * CARGAR Y VALIDAR GOOGLE CALENDAR
   * =========================================================
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCalendars() {
      if (!connected) {
        if (cancelled) return;

        setCalendars([]);
        setRequiresReauth(true);
        setMessage("Google Calendar no está conectado.");

        return;
      }

      setLoading(true);
      setMessage(null);

      try {
        const result = await getGoogleCalendarsAction();

        if (cancelled) return;

        /*
         * GOOGLE CONECTADO
         */
        if (result.success) {
          setCalendars(result.calendars);
          setRequiresReauth(false);

          /*
           * Si no existe calendario seleccionado en DB,
           * usamos automáticamente el calendario principal
           * Y LO GUARDAMOS EN POSTGRESQL.
           */
          if (!selectedCalendarId) {
            const primaryCalendar = result.calendars.find(
              (calendar) => calendar.primary
            );

            if (primaryCalendar) {
              setSelectedCalendar(primaryCalendar.id);

              setSaving(true);

              try {
                const saveResult =
                  await selectGoogleCalendarAction(
                    primaryCalendar.id
                  );

                if (cancelled) return;

                if (saveResult.success) {
                  setMessage(
                    "Google Calendar conectado correctamente."
                  );
                } else {
                  setMessage(saveResult.error);

                  if (
                    saveResult.code ===
                    "GOOGLE_REAUTH_REQUIRED"
                  ) {
                    setRequiresReauth(true);
                    setCalendars([]);
                  }
                }
              } catch (error) {
                if (cancelled) return;

                console.error(
                  "[GoogleCalendarSettings] auto-select calendar error:",
                  error
                );

                setMessage(
                  "Google Calendar fue autorizado, pero no fue posible guardar el calendario."
                );
              } finally {
                if (!cancelled) {
                  setSaving(false);
                }
              }
            }
          }

          return;
        }

        /*
         * GOOGLE REQUIERE REAUTORIZACIÓN
         */
        setCalendars([]);

        if (
          result.code === "GOOGLE_REAUTH_REQUIRED"
        ) {
          setRequiresReauth(true);
          setMessage(
            "La conexión con Google Calendar expiró o fue revocada. Es necesario reconectar la cuenta."
          );

          return;
        }

        /*
         * OTRO ERROR
         */
        setRequiresReauth(false);
        setMessage(result.error);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "[GoogleCalendarSettings] load calendars error:",
          error
        );

        setMessage(
          "No fue posible comprobar la conexión con Google Calendar."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCalendars();

    return () => {
      cancelled = true;
    };
  }, [connected, selectedCalendarId]);

  /*
   * =========================================================
   * CONECTAR / REAUTORIZAR
   * =========================================================
   */
  function handleConnect() {
    window.location.assign("/api/google/auth");
  }

  /*
   * =========================================================
   * GUARDAR CALENDARIO
   * =========================================================
   */
  async function handleSave() {
    if (!selectedCalendar) {
      setMessage("Selecciona un calendario.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await selectGoogleCalendarAction(
        selectedCalendar
      );

      if (result.success) {
        setMessage(
          "Calendario guardado correctamente."
        );

        return;
      }

      setMessage(result.error);

      if (
        result.code ===
        "GOOGLE_REAUTH_REQUIRED"
      ) {
        setRequiresReauth(true);
        setCalendars([]);
      }
    } catch (error) {
      console.error(
        "[GoogleCalendarSettings] save calendar error:",
        error
      );

      setMessage(
        "No fue posible guardar el calendario."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * GOOGLE DESCONECTADO / REAUTH REQUIRED
   * =========================================================
   */
  if (!connected || requiresReauth) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Google Calendar
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {!connected
              ? "Google Calendar todavía no está conectado."
              : "La conexión con Google Calendar ya no es válida."}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleConnect}
        >
          Reconectar Google Calendar
        </Button>

        {message && (
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    );
  }

  /*
   * =========================================================
   * GOOGLE CONECTADO
   * =========================================================
   */
  return (
    <div className="space-y-4 rounded-lg border p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Google Calendar
        </h2>

        <p className="text-sm text-muted-foreground">
          Google Calendar está conectado.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="calendar"
          className="text-sm font-medium"
        >
          Calendario de la clínica
        </label>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Comprobando conexión y cargando
            calendarios...
          </p>
        ) : calendars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No se encontraron calendarios disponibles.
          </p>
        ) : (
          <select
            id="calendar"
            value={selectedCalendar}
            onChange={(event) => {
              setSelectedCalendar(event.target.value);
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">
              Selecciona un calendario
            </option>

            {calendars.map((calendar) => (
              <option
                key={calendar.id}
                value={calendar.id}
              >
                {calendar.summary || "Sin nombre"}

                {calendar.primary
                  ? " (principal)"
                  : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={
            saving ||
            loading ||
            !selectedCalendar ||
            calendars.length === 0
          }
        >
          {saving
            ? "Guardando..."
            : "Guardar calendario"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleConnect}
          disabled={saving || loading}
        >
          Reconectar
        </Button>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
