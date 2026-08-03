"use client";

import { Plus } from "lucide-react";

import { createService } from "../actions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { ServiceForm } from "./service-form";

export function CreateServiceDialog() {
  return (
    <Dialog>
      <DialogTrigger
  render={<Button />}
>
  <Plus className="mr-2 h-4 w-4" />

  Nuevo servicio
</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Nuevo servicio
          </DialogTitle>
        </DialogHeader>

        <ServiceForm
          action={createService}
          submitLabel="Guardar"
        />
      </DialogContent>
    </Dialog>
  );
}