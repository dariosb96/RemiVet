"use client";

import Link from "next/link";

import { Clock3, PawPrint } from "lucide-react";
import { Service } from "@prisma/client";

import {
  buttonVariants,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  service: Service;
}

export function ServiceCard({
  service,
}: Props) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">

      <div className="mb-5 flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <PawPrint className="h-6 w-6 text-primary" />
        </div>

        <div className="min-w-0">

          <h2 className="font-semibold">
            {service.name}
          </h2>

          {service.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {service.description}
            </p>
          )}

        </div>

      </div>

      <div className="mb-6 space-y-2 text-sm">

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock3 className="h-4 w-4" />
          <span>
            {service.durationMinutes} min
          </span>
        </div>

        <p className="text-2xl font-bold">
          $
          {Number(service.price).toFixed(2)}
        </p>

      </div>

      <Link
        href={`/reservar/${service.id}`}
        className={cn(
          buttonVariants(),
          "mt-auto w-full"
        )}
      >
        Seleccionar
      </Link>

    </div>
  );
}