import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List of routes that require authentication
const PROTECTED_ROUTES = ["/game", "/profile", "/leaderboard", "/achievements"];

// Routes that should redirect to dashboard if user is already logged in
const AUTH_ROUTES = ["/login", "/register"];

// Check if the path matches any of the protected paths
function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

// Check if the path is an authentication route
function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute(path) && !session) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirect_to", path);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute(path) && session) {
    return NextResponse.redirect(new URL("/game", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|api(?!/auth)).*)",
  ],
};
