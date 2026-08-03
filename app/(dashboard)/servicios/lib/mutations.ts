import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  CreateServiceInput,
  UpdateServiceInput,
} from "../types";

export async function createService(
  data: CreateServiceInput,
) {
  return prisma.service.create({
    data: {
      ...data,
      price: new Prisma.Decimal(data.price),
    },
  });
}

export async function updateService(
  data: UpdateServiceInput,
) {
  const { id, ...service } = data;

  return prisma.service.update({
    where: {
      id,
    },
    data: {
      ...service,
      price: new Prisma.Decimal(service.price),
    },
  });
}

export async function toggleService(
  id: string,
  active: boolean,
) {
  return prisma.service.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });
}

export async function deleteService(
  id: string,
) {
  const appointments =
    await prisma.appointment.count({
      where: {
        serviceId: id,
      },
    });

  if (appointments > 0) {
    throw new Error(
      "No puedes eliminar un servicio que tiene citas registradas."
    );
  }

  return prisma.service.delete({
    where: {
      id,
    },
  });
}