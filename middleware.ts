import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminToken } from "./lib/env";

const ADMIN_PATHS = ["/admin", "/api/admin"];
const OPEN_PATHS = ["/admin/login", "/api/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = ADMIN_PATHS.some((path) => pathname.startsWith(path));
  const isOpen = OPEN_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtected || isOpen) {
    return NextResponse.next();
  }

  const token = getAdminToken();
  const cookie = request.cookies.get("admin_session")?.value ?? "";

  if (!token || cookie !== token) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
