// app/api/admin/encomendas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.customOrder.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(orders);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
