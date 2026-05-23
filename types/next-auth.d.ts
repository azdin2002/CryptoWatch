import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      nom: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    nom: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    nom?: string;
  }
}
