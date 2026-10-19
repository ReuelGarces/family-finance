import type { DefaultSession } from "next-auth";

type FamilyRole = "ADMIN" | "FAMILY";

declare module "next-auth" {
  interface User {
    role: FamilyRole;
  }

  interface Session {
    user: {
      id: string;
      role: FamilyRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: FamilyRole;
  }
}

export {};
