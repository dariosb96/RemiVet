import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.ADMIN_EMAIL;

  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en .env"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      name: "Administrador",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin creado/actualizado: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });