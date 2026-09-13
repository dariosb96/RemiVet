"use client";

import { useCallback, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { updateService } from "../actions";
import { ServiceForm } from "./service-form";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  displayOrder: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditServiceDialogProps {
  service: Service;
  children: React.ReactElement;
}

export function EditServiceDialog({
  service,
  children,
}: EditServiceDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar servicio</DialogTitle>
        </DialogHeader>

        <ServiceForm
          key={service.id}
          action={updateService}
          submitLabel="Guardar cambios"
          onSuccess={handleSuccess}
          defaultValues={{
            id: service.id,
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            color: service.color ?? "#3b82f6",
          }}
        />
      </DialogContent>
    </Dialog>
  );
}