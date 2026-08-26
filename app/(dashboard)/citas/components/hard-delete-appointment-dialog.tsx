"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { hardDeleteAppointment } from "../actions";

interface HardDeleteAppointmentDialogProps {
  id: string;
}

export function HardDeleteAppointmentDialog({
  id,
}: HardDeleteAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    setOpen(true);
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const result = await hardDeleteAppointment(id);

      if (!result.success) {
        setError(
          result.message ??
            "No fue posible eliminar la cita."
        );

        return;
      }

      setOpen(false);

      /*
       * Actualizamos la página para que la cita
       * desaparezca inmediatamente de la tabla.
       */
      window.location.reload();
    } catch (error) {
      console.error(
        "[HardDeleteAppointmentDialog] error:",
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
    <>
      {/* =====================================================
          BOTÓN ELIMINAR
          ===================================================== */}

      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={handleOpen}
      >
        Eliminar
      </Button>

      {/* =====================================================
          CONFIRMACIÓN
          ===================================================== */}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!loading) {
            setOpen(value);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>
            Eliminar cita permanentemente
          </DialogTitle>

          <DialogDescription>
            Estás a punto de eliminar esta cita
            permanentemente de RemiVet.
            <br />
            <strong>
              Esta acción no se puede deshacer.
            </strong>
          </DialogDescription>

          {error && (
            <div className="rounded-lg border border-rose-300/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:border-rose-900/50 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
            >
              {loading
                ? "Eliminando..."
                : "Sí, eliminar permanentemente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}