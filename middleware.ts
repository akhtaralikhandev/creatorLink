import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/login", "/register", "/api/auth"];
const BRAND_ROUTES = ["/brand"];
const CREATOR_ROUTES = ["/creator"];
const ADMIN_ROUTES = ["/admin"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    // Redirect authenticated users away from auth pages
    if (session && (pathname === "/login" || pathname === "/register")) {
      const role = session.user.role;
      if (role === "BRAND") return NextResponse.redirect(new URL("/brand/dashboard", nextUrl));
      if (role === "CREATOR") return NextResponse.redirect(new URL("/creator/dashboard", nextUrl));
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!session) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl));
  }

  const role = session.user.role;

  // Users without a role must complete onboarding
  if (!role && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  // Role-based route guards
  if (BRAND_ROUTES.some((r) => pathname.startsWith(r)) && role !== "BRAND") {
    return NextResponse.redirect(new URL("/creator/dashboard", nextUrl));
  }
  if (CREATOR_ROUTES.some((r) => pathname.startsWith(r)) && role !== "CREATOR") {
    return NextResponse.redirect(new URL("/brand/dashboard", nextUrl));
  }
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "BRAND") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
