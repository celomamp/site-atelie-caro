// app/api/admin/produtos/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
    body.weight = num(body.weight, 2);
    body.width = num(body.width, 30);
    body.height = num(body.height, 20);
    body.length = num(body.length, 20);
    const { categories, ...data } = body;
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        images: body.images !== undefined ? JSON.stringify(body.images) : undefined,
        ...(categories
          ? {
              categories: {
                set: (Array.isArray(categories) ? categories : []).map((id: string) => ({
                  id,
                })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
