import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ ok: false, error: "Nome e slug são obrigatórios." }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { name: body.name.trim(), slug: body.slug.trim() },
    });
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    const conflict = e?.code === "P2002";
    return NextResponse.json(
      { ok: false, error: conflict ? "Já existe uma categoria com esse nome ou slug." : undefined },
      { status: conflict ? 409 : 400 }
    );
  }
}
