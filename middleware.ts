// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import { SESSION_COOKIE, SESSION_PASSWORD } from "@/lib/session-config";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  let session: { isAdmin?: boolean } = {};
  try {
    const sealed = req.cookies.get(SESSION_COOKIE)?.value;
    if (sealed) {
      session = await unsealData<{ isAdmin?: boolean }>(sealed, {
        password: SESSION_PASSWORD,
      });
    }
  } catch {
    session = {};
  }
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
