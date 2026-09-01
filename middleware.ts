// middleware.ts
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_PASSWORD } from "@/lib/session-config";

export async function middleware(req: Request) {
  const res = NextResponse.next();
  const session = await getIronSession<{ isAdmin: boolean }>(cookies(), {
    password: SESSION_PASSWORD,
    cookieName: SESSION_COOKIE,
  });
  const url = new URL(req.url);
  const isLogin =
    url.pathname.startsWith("/admin/login") ||
    url.pathname.startsWith("/api/admin/login");
  if (!session.isAdmin && !isLogin) {
    if (url.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
