import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import SetupForm from "./setup-form";

export default async function SetupPage() {
  const userCount =
    await prisma.user.count();

  /*
   * =========================================================
   * SETUP COMPLETADO
   * =========================================================
   *
   * Una vez creado el primer usuario, /setup deja de estar
   * disponible.
   */

  if (userCount > 0) {
    redirect("/setup");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            Configurar RemiVet
          </h1>

          <p className="mt-2 text-muted-foreground">
            Crea el administrador inicial de la clínica.
          </p>
        </div>

        <SetupForm />
      </div>
    </main>
  );
}