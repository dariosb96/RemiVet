"use client";

import { useState } from "react";

import { Service } from "@prisma/client";

import { updateService } from "../actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ServiceForm } from "./service-form";

interface EditServiceDialogProps {
  service: Service;
  children: React.ReactElement;
}

export function EditServiceDialog({
  service,
  children,
}: EditServiceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        render={children}
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Editar servicio
          </DialogTitle>
        </DialogHeader>

        <ServiceForm
          action={updateService}
          submitLabel="Guardar cambios"
          defaultValues={{
            id: service.id,
            name: service.name,
            description:
              service.description,
            durationMinutes:
              service.durationMinutes,
            price: Number(service.price),
            color:
              service.color ?? "#3b82f6",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}