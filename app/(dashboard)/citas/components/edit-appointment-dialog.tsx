"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Appointment,
  AppointmentStatus,
  Service,
} from "@prisma/client";
import { toast } from "sonner";

import { updateAppointment } from "../actions";

import {
  appointmentSchema,
  AppointmentFormValues,
} from "../schema";

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
  appointment: Appointment;
  services: Service[];
  children: React.ReactElement;
}


export function EditAppointmentDialog({
  appointment,
  services,
  children,
}: Props) {

  const [pending, startTransition] =
    useTransition();


  const form =
    useForm<AppointmentFormValues>({
      resolver:
        zodResolver(
          appointmentSchema
        ),

      defaultValues:{
        ownerName:
          appointment.ownerName,

        phone:
          appointment.phone,

        email:
          appointment.email ?? "",

        petName:
          appointment.petName,

        serviceId:
          appointment.serviceId,

        date:
          appointment.startAt
          .toISOString()
          .split("T")[0],

        time:
          appointment.startAt
          .toISOString()
          .slice(11,16),

        notes:
          appointment.notes ?? "",

        status:
          appointment.status,
      },
    });


  function onSubmit(
    values: AppointmentFormValues
  ){

    startTransition(async()=>{

      const result =
        await updateAppointment(
          appointment.id,
          values
        );


      if(!result.success){
        toast.error(
          result.message ??
          "Error al actualizar"
        );

        return;
      }


      toast.success(
        "Cita actualizada"
      );

    });
  }


  return(
    <Dialog>

      <DialogTrigger render={children}/>


      <DialogContent className="sm:max-w-2xl">

        <DialogHeader>
          <DialogTitle>
            Editar cita
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
              {pending
              ?"Guardando..."
              :"Guardar cambios"}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>
  );
}