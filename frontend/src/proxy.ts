import { auth } from "@/auth"

// Export a named function 'proxy' as required by Next.js 16
export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl))
  }

  // Redirect unauthenticated users to the login page for protected routes
  if (!isLoggedIn && !isAuthPage && req.nextUrl.pathname !== "/") {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})

// Configure target paths for proxy interception
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images/assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
