// app/api/admin/encomendas/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const order = await prisma.customOrder.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
