"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";

import { deleteService } from "../actions";
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

interface DeleteServiceDialogProps {
  service: Service;
  children: React.ReactElement;
}

export function DeleteServiceDialog({
  service,
  children,
}: DeleteServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteService(service.id);

      if (!result.success) {
        setError(
          result.message ?? "No fue posible eliminar el servicio.",
        );
        return;
      }

      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen);

          if (!nextOpen) {
            setError(null);
          }
        }
      }}
    >
      <DialogTrigger render={children} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar servicio</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Seguro que deseas eliminar{" "}
            <span className="font-semibold text-foreground">
              {service.name}
            </span>
            ?
          </p>

          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                disabled={pending}
              >
                Cancelar
              </Button>
            }
          />

          <Button
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>

        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
              disabled={pending}
            >
              <XIcon className="size-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
