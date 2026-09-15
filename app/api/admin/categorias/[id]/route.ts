import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { categorySchema } from "@/lib/admin-schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = categorySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Nome e slug são obrigatórios." },
        { status: 400 }
      );
    }
    const category = await prisma.category.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    console.error(e);
    const conflict = e?.code === "P2002";
    return NextResponse.json(
      { ok: false, error: conflict ? "Já existe uma categoria com esse nome ou slug." : undefined },
      { status: conflict ? 409 : 400 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const count = await prisma.category.findUnique({
      where: { id: params.id },
      select: { _count: { select: { products: true } } },
    });
    if (count && count._count.products > 0) {
      return NextResponse.json(
        { ok: false, error: "Não é possível excluir: há produtos vinculados a esta categoria." },
        { status: 409 }
      );
    }
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
