"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentStatus } from "@prisma/client";
import { toast } from "sonner";

import { createAppointment } from "../actions";

import {
  appointmentSchema,
  AppointmentFormValues,
} from "../schema";

import {
  ServiceDTO,

} from "@/types/appointment"

import { AppointmentForm } from "./appointment-form";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


interface Props {
  children: React.ReactElement;
  services: ServiceDTO[];
}


const defaultValues: AppointmentFormValues = {
  ownerName: "",
  phone: "",
  email: "",
  petName: "",
  serviceId: "",
  date: "",
  time: "",
  notes: "",
  status: AppointmentStatus.PENDING,
};


export function CreateAppointmentDialog({
  children,
  services,
}: Props) {

  const [pending, startTransition] =
    useTransition();


  const form =
    useForm<AppointmentFormValues>({
      resolver: zodResolver(
        appointmentSchema
      ),
      defaultValues,
      mode: "onChange",
    });



  function onSubmit(
    values: AppointmentFormValues
  ) {

    startTransition(async () => {

      const result =
        await createAppointment(values);


      if (!result.success) {

        toast.error(
          result.message ??
          "Error al crear cita"
        );

        return;
      }


      toast.success(
        "Cita creada correctamente"
      );


      form.reset(defaultValues);

    });
  }



  return (
    <Dialog>

      <DialogTrigger render={children} />


      <DialogContent className="sm:max-w-2xl">

        <DialogHeader>
          <DialogTitle>
            Nueva cita
          </DialogTitle>
        </DialogHeader>



        <form
          onSubmit={
            form.handleSubmit(onSubmit)
          }
          className="space-y-6"
        >


          <AppointmentForm
            form={form}
            services={services}
          />



          <DialogFooter>

            <Button
              type="submit"
              disabled={pending}
            >

              {
                pending
                  ? "Guardando..."
                  : "Guardar"
              }

            </Button>

          </DialogFooter>


        </form>


      </DialogContent>


    </Dialog>
  );
}