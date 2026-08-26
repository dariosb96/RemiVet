"use client";

import { useState } from "react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { hardDeleteAppointment } from "../actions";

interface HardDeleteAppointmentDialogProps {
  id: string;
}

export function HardDeleteAppointmentDialog({
  id,
}: HardDeleteAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const result = await hardDeleteAppointment(id);

      if (!result.success) {
        setError(
          result.message ||
            "No fue posible eliminar la cita."
        );
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error(
        "[HardDeleteAppointmentDialog]",
        error
      );

      setError(
        "Ocurrió un error al eliminar la cita."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center justify-center rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/20 hover:text-rose-200">
        Eliminar
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            ¿Eliminar cita definitivamente?
          </DialogTitle>

          <DialogDescription>
            Esta acción eliminará permanentemente
            la cita de RemiVet. No podrás
            recuperarla después.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <DialogFooter>
          <DialogClose>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
          </DialogClose>

          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading
              ? "Eliminando..."
              : "Eliminar definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}