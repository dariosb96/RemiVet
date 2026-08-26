"use client";

import {
  useEffect,
  useState,
} from "react";

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
  const [calendars, setCalendars] =
    useState<CalendarOption[]>([]);

  const [selectedCalendar, setSelectedCalendar] =
    useState<string>(
      selectedCalendarId ?? ""
    );

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  /*
   * IMPORTANTE:
   *
   * Este estado representa la conexión REAL que
   * conocemos desde el cliente.
   *
   * Si el servidor devuelve GOOGLE_REAUTH_REQUIRED,
   * lo ponemos inmediatamente en true.
   */
  const [requiresReauth, setRequiresReauth] =
    useState<boolean>(!connected);

  /*
   * =========================================================
   * SINCRONIZAR ESTADO INICIAL
   * =========================================================
   */
  useEffect(() => {
    setRequiresReauth(!connected);

    if (!connected) {
      setCalendars([]);
      setSelectedCalendar(
        selectedCalendarId ?? ""
      );
    }
  }, [
    connected,
    selectedCalendarId,
  ]);

  /*
   * =========================================================
   * CARGAR CALENDARIOS
   * =========================================================
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCalendars() {
      /*
       * Si el servidor ya sabe que no existe token,
       * no intentamos llamar a Google.
       */
      if (!connected) {
        if (!cancelled) {
          setCalendars([]);
          setRequiresReauth(true);
          setMessage(
            "Google Calendar no está conectado."
          );
        }

        return;
      }

      setLoading(true);
      setMessage(null);

      try {
        const result =
          await getGoogleCalendarsAction();

        if (cancelled) {
          return;
        }

        /*
         * =====================================================
         * GOOGLE OK
         * =====================================================
         */
        if (result.success) {
          setCalendars(
            result.calendars
          );

          setRequiresReauth(false);

          /*
           * Si todavía no hay calendario seleccionado,
           * intentamos seleccionar automáticamente el principal.
           */
          if (
            !selectedCalendarId
          ) {
            const primaryCalendar =
              result.calendars.find(
                (calendar) =>
                  calendar.primary
              );

            if (primaryCalendar) {
              setSelectedCalendar(
                primaryCalendar.id
              );
            }
          }

          return;
        }

        /*
         * =====================================================
         * GOOGLE REQUIERE REAUTH
         * =====================================================
         */
        setCalendars([]);

        setMessage(
          result.error
        );

        if (
          result.code ===
          "GOOGLE_REAUTH_REQUIRED"
        ) {
          setRequiresReauth(true);
          return;
        }

        /*
         * Cualquier otro error NO significa necesariamente
         * que haya que reconectar Google.
         */
        setRequiresReauth(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "[GoogleCalendarSettings] load calendars error:",
          error
        );

        setMessage(
          "No fue posible cargar los calendarios de Google."
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
  }, [
    connected,
    selectedCalendarId,
  ]);

  /*
   * =========================================================
   * CONECTAR / REAUTORIZAR
   * =========================================================
   */
  function handleConnect() {
    window.location.assign(
      "/api/google/auth"
    );
  }

  /*
   * =========================================================
   * GUARDAR CALENDARIO
   * =========================================================
   */
  async function handleSave() {
    if (!selectedCalendar) {
      setMessage(
        "Selecciona un calendario."
      );

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result =
        await selectGoogleCalendarAction(
          selectedCalendar
        );

      if (result.success) {
        setMessage(
          "Calendario guardado correctamente."
        );

        return;
      }

      setMessage(
        result.error
      );

      if (
        result.code ===
        "GOOGLE_REAUTH_REQUIRED"
      ) {
        setRequiresReauth(true);
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
   * REAUTH / NO CONECTADO
   * =========================================================
   *
   * ESTE BLOQUE ES INTENCIONALMENTE SIMPLE.
   *
   * No depende de que connected cambie.
   *
   * Si cualquiera de las dos condiciones dice que
   * necesitamos autorización, mostramos el botón.
   */
  if (
    !connected ||
    requiresReauth
  ) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Google Calendar
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {connected
              ? "La conexión actual con Google Calendar ya no es válida."
              : "Google Calendar todavía no está conectado."}
          </p>
        </div>

        <Button
          type="button"
          onClick={
            handleConnect
          }
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
   * CONECTADO
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
            Comprobando conexión y
            cargando calendarios...
          </p>
        ) : calendars.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No se encontraron calendarios
            disponibles.
          </p>
        ) : (
          <select
            id="calendar"
            value={
              selectedCalendar
            }
            onChange={(event) => {
              setSelectedCalendar(
                event.target.value
              );
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">
              Selecciona un calendario
            </option>

            {calendars.map(
              (calendar) => (
                <option
                  key={calendar.id}
                  value={calendar.id}
                >
                  {calendar.summary ||
                    "Sin nombre"}

                  {calendar.primary
                    ? " (principal)"
                    : ""}
                </option>
              )
            )}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={
            handleSave
          }
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

        {/*
         * También dejamos disponible una reconexión manual
         * aunque aparentemente esté conectado.
         *
         * Esto es útil para el caso futuro en que Google
         * revoque el refresh token.
         */}
        <Button
          type="button"
          variant="outline"
          onClick={
            handleConnect
          }
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