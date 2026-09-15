import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import Image from "next/image";

import SetupForm from "./setup-form";

export default async function SetupPage() {
  const userCount =
    await prisma.user.count();

 if (userCount > 0) {
  redirect("/login");
}

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
   <div className="mb-2 flex flex-col items-center text-center">
            <Image
              src="/Remi2.png"
              alt="Remi Vet"
              width={420}
              height={420}
              priority
              className="mx-auto h-auto w-[130px] sm:w-[160px]"
            />
          </div>

          <p className="mt-2 text-gray-200">
            Crea una cuenta de administrador
          </p>
        </div>

        <SetupForm />
      </div>
    </main>
  );
}