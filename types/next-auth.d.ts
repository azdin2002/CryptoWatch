import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      name: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    name?: string;
  }
}
