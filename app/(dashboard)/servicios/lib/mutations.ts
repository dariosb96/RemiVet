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
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      price: new Prisma.Decimal(data.price),
      color: data.color ?? null,
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
      name: service.name,
      description:
        service.description ?? null,
      durationMinutes:
        service.durationMinutes,
      price: new Prisma.Decimal(
        service.price,
      ),
      color: service.color ?? null,
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
  try {
    return await prisma.service.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "No puedes eliminar un servicio que tiene citas registradas. Puedes desactivarlo en su lugar.",
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error(
        "El servicio ya no existe.",
      );
    }

    throw error;
  }
}