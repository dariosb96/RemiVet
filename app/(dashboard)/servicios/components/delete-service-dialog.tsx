"use client";

import { useTransition } from "react";
import { Service } from "@prisma/client";
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

interface DeleteServiceDialogProps {
  service: Service;
  children: React.ReactElement;
}

export function DeleteServiceDialog({
  service,
  children,
}: DeleteServiceDialogProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger render={children} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Eliminar servicio
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          ¿Seguro que deseas eliminar{" "}
          <span className="font-semibold">
            {service.name}
          </span>
          ? Esta acción no se puede deshacer.
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
            onClick={() =>
              startTransition(async () => {
                await deleteService(service.id);
              })
            }
          >
            {pending
              ? "Eliminando..."
              : "Eliminar"}
          </Button>
        </DialogFooter>

        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-3"
            >
              <XIcon className="size-4" />
              <span className="sr-only">
                Cerrar
              </span>
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}