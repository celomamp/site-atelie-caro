import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { workshopUpdateSchema } from "@/lib/admin-schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = workshopUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const workshop = await prisma.workshop.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ok: true, workshop });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    await prisma.workshop.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
