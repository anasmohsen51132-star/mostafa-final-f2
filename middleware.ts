// middleware.ts
// Runs in Edge Runtime — only import edge-safe modules
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, extractTokenEdge } from "@/lib/auth-edge";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/customize",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api/auth/"))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = extractTokenEdge(req);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyTokenEdge(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ success: false, error: "انتهت الجلسة" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth_token");
    return res;
  }

  // Role-based protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (payload.role !== "ADMIN" && payload.role !== "OWNER") {
      if (pathname.startsWith("/api/")) {
        return Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/owner") || pathname.startsWith("/api/owner")) {
    if (payload.role !== "OWNER") {
      if (pathname.startsWith("/api/")) {
        return Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Inject user context into request headers for API routes
  const headers = new Headers(req.headers);
  headers.set("x-user-id",    payload.sub);
  headers.set("x-user-role",  payload.role);
  headers.set("x-user-phone", payload.phone);
  headers.set("x-user-name",  payload.name);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
