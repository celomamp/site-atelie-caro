// app/api/admin/produtos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
    body.weight = num(body.weight, 2);
    body.width = num(body.width, 30);
    body.height = num(body.height, 20);
    body.length = num(body.length, 20);
    const { categories, ...data } = body;
    const product = await prisma.product.create({
      data: {
        ...data,
        images: JSON.stringify(body.images ?? []),
        ...(categories
          ? {
              categories: {
                connect: (Array.isArray(categories) ? categories : []).map((id: string) => ({
                  id,
                })),
              },
            }
          : {}),
      },
    });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
