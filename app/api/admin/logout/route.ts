// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { guardAdminMutation } from "@/lib/admin-guard";

export async function POST(req: Request) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
