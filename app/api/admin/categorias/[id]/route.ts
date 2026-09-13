import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ ok: false, error: "Nome e slug são obrigatórios." }, { status: 400 });
    }
    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name: body.name.trim(), slug: body.slug.trim() },
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
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
