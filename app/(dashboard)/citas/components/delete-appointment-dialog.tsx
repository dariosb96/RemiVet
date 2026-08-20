"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAppointment } from "@/lib/appointments/actions";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  id: string;
  children: React.ReactElement;
}

export function DeleteAppointmentDialog({
  id,
  children,
}: Props) {
  const [pending, startTransition] =
    useTransition();

  const [open, setOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result =
        await deleteAppointment(id);

      if (!result.success) {
        toast.error(
          result.message ??
            "No se pudo cancelar la cita."
        );

        return;
      }

      setOpen(false);

      toast.success(
        "Cita cancelada."
      );
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger render={children} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cancelar cita
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Esta acción no se puede deshacer.
        </p>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline">
                Regresar
              </Button>
            }
          />

          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending
              ? "Cancelando..."
              : "Cancelar cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}