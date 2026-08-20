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

  useEffect(() => {
    if (!connected) return;

    async function loadCalendars() {
      setLoading(true);
      setMessage(null);

      const result =
        await getGoogleCalendarsAction();

      if (result.success) {
        setCalendars(result.calendars);
      } else {
        setMessage(result.error);
      }

      setLoading(false);
    }

    loadCalendars();
  }, [connected]);

  async function handleSave() {
    if (!selectedCalendar) {
      setMessage(
        "Selecciona un calendario."
      );

      return;
    }

    setSaving(true);
    setMessage(null);

    const result =
      await selectGoogleCalendarAction(
        selectedCalendar
      );

    if (result.success) {
      setMessage(
        "Calendario guardado correctamente."
      );
    } else {
      setMessage(result.error);
    }

    setSaving(false);
  }

  if (!connected) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Google Calendar
          </h2>

          <p className="text-sm text-muted-foreground">
            Conecta Google Calendar para
            sincronizar automáticamente las citas.
          </p>
        </div>

        <Button
          onClick={() => {
            window.location.href =
              "/api/google/auth";
          }}
        >
          Conectar Google Calendar
        </Button>
      </div>
    );
  }

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
            Cargando calendarios...
          </p>
        ) : (
          <select
            id="calendar"
            value={selectedCalendar}
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

            {calendars.map((calendar) => (
              <option
                key={calendar.id}
                value={calendar.id}
              >
                {calendar.summary}
                {calendar.primary
                  ? " (principal)"
                  : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={
          saving ||
          loading ||
          !selectedCalendar
        }
      >
        {saving
          ? "Guardando..."
          : "Guardar calendario"}
      </Button>

      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}