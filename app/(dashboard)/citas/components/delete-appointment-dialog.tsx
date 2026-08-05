"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { deleteAppointment } from "../actions";

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

  function handleDelete() {
    startTransition(async () => {
      const result =
        await deleteAppointment(id);

      if (!result.success) {
        toast.error(
          result.message ??
            "No se pudo eliminar la cita."
        );

        return;
      }

      toast.success(
        "Cita eliminada."
      );
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={children} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Eliminar cita
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Esta acción no se puede deshacer.
        </p>

        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline">
                Cancelar
              </Button>
            }
          />

          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending
              ? "Eliminando..."
              : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}