// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hit, clientIp } from "@/lib/ratelimit";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { requireSameOrigin } from "@/lib/admin-guard";

export async function POST(req: Request) {
  const crossSite = requireSameOrigin(req);
  if (crossSite) return crossSite;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    console.error(
      "ADMIN_PASSWORD não configurado — login do admin desabilitado."
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const rl = await hit(`login:${clientIp(req)}`);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }
  const session = await getSession();
  if (verifyAdminPassword(password, expectedPassword)) {
    session.isAdmin = true;
    await session.save();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
