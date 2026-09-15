// app/api/admin/encomendas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const orders = await prisma.customOrder.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(orders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
