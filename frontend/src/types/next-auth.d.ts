import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      householdId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    householdId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    householdId?: string
  }
}
