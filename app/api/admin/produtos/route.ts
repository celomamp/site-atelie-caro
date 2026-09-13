// app/api/admin/produtos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categories, ...data } = body;
    const product = await prisma.product.create({
      data: {
        ...data,
        images: JSON.stringify(body.images ?? []),
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
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
