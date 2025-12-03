import type { AccountRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      roles?: AccountRole[];
      primaryRole?: AccountRole | null;
      hasCompletedOnboarding?: boolean;
    };
  }

  interface User {
    roles?: AccountRole[];
    primaryRole?: AccountRole | null;
    hasCompletedOnboarding?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: AccountRole[];
    primaryRole?: AccountRole | null;
    hasCompletedOnboarding?: boolean;
  }
}

