// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const { password } = await req.json();
  const session = await getSession();
  if (password === process.env.ADMIN_PASSWORD) {
    session.isAdmin = true;
    await session.save();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
