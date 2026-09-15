// app/api/admin/encomendas/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { encomendaStatusSchema } from "@/lib/admin-schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = encomendaStatusSchema.safeParse((await req.json()).status);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const order = await prisma.customOrder.update({
      where: { id: params.id },
      data: { status: parsed.data },
    });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
