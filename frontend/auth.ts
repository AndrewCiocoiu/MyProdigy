import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import jwt from "jsonwebtoken"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Rule 3: Centralized API Calls
          // We call the Go backend here to verify credentials.
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) {
            return null
          }

          const user = await res.json()
          // Expected response from Go backend:
          // { "id": "user-uuid", "email": "user@example.com", "name": "Cozy Lover", "householdId": "household-uuid" }
          if (user && user.id) {
            return user
          }
          return null
        } catch (error) {
          logError("Authentication request failed", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // Custom JWT encoding/decoding so the Go backend can verify NextAuth JWTs
    async encode({ token, secret }) {
      if (!token) return ""
      const secretKey = typeof secret === "string" ? secret : (Array.isArray(secret) ? secret[0] : String(secret))
      // Use standard HS256 signing instead of NextAuth's default JWE encryption
      return jwt.sign(token, secretKey, { algorithm: "HS256" })
    },
    async decode({ token, secret }) {
      if (!token) return null
      try {
        const secretKey = typeof secret === "string" ? secret : (Array.isArray(secret) ? secret[0] : String(secret))
        // Verify standard HS256 signature
        return jwt.verify(token, secretKey, { algorithms: ["HS256"] }) as any
      } catch (e) {
        logError("JWT verification failed", e)
        return null
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        // Store householdId in token if returned by backend
        if ("householdId" in user) {
          token.householdId = user.householdId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        if (token.householdId) {
          session.user.householdId = token.householdId as string
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
})

// Helper to log errors safely without throwing
function logError(message: string, error: unknown) {
  console.error(`[NextAuth Configuration] ${message}:`, error)
}
