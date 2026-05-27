import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/projects", "/analytics", "/admin"];

export function proxy(request: NextRequest) {
  const isProtected = protectedRoutes.some((path) => request.nextUrl.pathname.startsWith(path));
  const hasSession = Boolean(request.cookies.get("access_token")?.value);

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/analytics/:path*", "/admin/:path*"],
};
