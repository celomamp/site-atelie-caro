// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = hit(`login:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, retryAfter: rl.retryAfter },
      { status: 429 },
    );
  }
  const session = await getSession();
  if (password === process.env.ADMIN_PASSWORD) {
    session.isAdmin = true;
    await session.save();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
