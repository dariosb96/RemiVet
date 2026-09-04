import { prisma } from "@/lib/prisma";

import {
  GoogleCalendarSettings,
} from "./components/google-calendar-settings";

import {
  BusinessDaysSettings,
} from "./components/business-days-settings";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  const settings =
    await prisma.settings.findFirst();

  if (!settings) {
    throw new Error(
      "RemiVet: no existe el registro de Settings."
    );
  }

  const connected =
    Boolean(
      settings.googleRefreshToken
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Configuración
        </h1>

        <p className="text-sm text-muted-foreground">
          Configura las preferencias de la clínica.
        </p>
      </div>

      <BusinessDaysSettings
        businessDays={
          settings.businessDays ??
          null
        }
      />

      <GoogleCalendarSettings
        connected={connected}
        selectedCalendarId={
          settings.googleCalendarId ??
          null
        }
      />
    </div>
  );
}