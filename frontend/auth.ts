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
          // Inside Docker container, process.env.NEXT_PUBLIC_API_URL points to localhost:8080 (client-side).
          // Server-side node fetch in Docker needs http://prodigy-backend:8080 or http://backend:8080.
          const isServer = typeof window === "undefined"
          const defaultInternalUrl = process.env.BACKEND_INTERNAL_URL || (isServer ? "http://prodigy-backend:8080" : "http://localhost:8080")
          const baseUrl = process.env.BACKEND_INTERNAL_URL || (isServer ? defaultInternalUrl : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")

          let res: Response
          try {
            res = await fetch(`${baseUrl}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            })
          } catch (fetchErr) {
            // Fallback attempt if first hostname failed inside container
            const fallbackUrl = baseUrl.includes("prodigy-backend")
              ? "http://backend:8080"
              : "http://localhost:8080"
            res = await fetch(`${fallbackUrl}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            })
          }

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
        const decoded = jwt.verify(token, secretKey, { algorithms: ["HS256"] })
        return typeof decoded === "object" && decoded !== null ? (decoded as Record<string, unknown>) : null
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
