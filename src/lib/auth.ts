import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { AccountRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles ?? [],
          primaryRole: user.primaryRole,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        };
      },
    }),
  ],
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
      user?: AdapterUser | null;
      newSession?: Session | null;
      trigger?: "update";
    }) {
      if (session.user && token.sub) {
        const sessionUser = session.user as Session["user"] & {
          id?: string;
          roles?: AccountRole[];
          primaryRole?: AccountRole | null;
        };
        sessionUser.id = token.sub;
        if (token.roles) {
          sessionUser.roles = token.roles as AccountRole[];
        }
        if ("primaryRole" in token) {
          sessionUser.primaryRole = token.primaryRole as AccountRole | null;
        }
        if ("hasCompletedOnboarding" in token) {
          sessionUser.hasCompletedOnboarding =
            typeof token.hasCompletedOnboarding === "boolean"
              ? token.hasCompletedOnboarding
              : undefined;
        }
      }
      return session;
    },
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: AdapterUser | null;
      trigger?: "update";
      session?: Session | null;
    }) {
      if (user?.id) {
        token.sub = user.id;
        token.roles = (user as AdapterUser & { roles?: AccountRole[] }).roles ?? token.roles;
        token.primaryRole =
          (user as AdapterUser & { primaryRole?: AccountRole | null }).primaryRole ??
          token.primaryRole;
        token.hasCompletedOnboarding =
          (user as AdapterUser & { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding ??
          token.hasCompletedOnboarding;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

