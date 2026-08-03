import { prisma } from "@/lib/prisma";

export async function getServices() {
  return prisma.service.findMany({
    orderBy: [
      {
        displayOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function getServiceById(
  id: string,
) {
  return prisma.service.findUnique({
    where: {
      id,
    },
  });
}

export async function getActiveServices() {
  return prisma.service.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        displayOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}