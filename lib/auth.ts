import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },

        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = credentials.email
          .trim()
          .toLowerCase();

        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },
          });

        if (!user) {
          return null;
        }

        const passwordValid =
          await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      /*
       * =======================================================
       * LOGIN
       * =======================================================
       *
       * Cuando el usuario inicia sesión, construimos el JWT
       * con los datos obtenidos directamente de PostgreSQL.
       */

      if (user) {
        token.id = user.id;
        token.role = user.role;

        return token;
      }

      /*
       * =======================================================
       * SESIÓN EXISTENTE
       * =======================================================
       *
       * En las siguientes peticiones comprobamos que el usuario
       * del JWT todavía exista en PostgreSQL.
       *
       * Esto es importante porque estamos usando JWT:
       *
       * - borrar un User de PostgreSQL NO borra automáticamente
       *   el JWT que ya tiene el navegador.
       *
       * Por eso hacemos esta comprobación.
       */

      if (!token.id) {
        throw new Error(
          "AUTH_USER_ID_MISSING"
        );
      }

      const existingUser =
        await prisma.user.findUnique({
          where: {
            id: token.id,
          },

          select: {
            id: true,
            role: true,
          },
        });

      /*
       * El usuario fue eliminado o ya no existe.
       *
       * No devolvemos un JWT incompleto.
       * Lanzamos un error para invalidar el proceso
       * de autenticación.
       */

      if (!existingUser) {
        throw new Error(
          "AUTH_USER_NOT_FOUND"
        );
      }

      /*
       * El usuario sigue existiendo.
       *
       * Actualizamos el JWT con el rol actual de PostgreSQL.
       */

      token.id = existingUser.id;
      token.role = existingUser.role;

      return token;
    },

    async session({
      session,
      token,
    }) {
      /*
       * jwt() garantiza que estos valores existen.
       */

      if (session.user) {
        session.user.id =
          token.id;

        session.user.role =
          token.role;
      }

      return session;
    },
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};