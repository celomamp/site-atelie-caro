// app/api/admin/produtos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { productCreateSchema } from "@/lib/admin-schemas";

export async function POST(req: Request) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = productCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const { categories, images, ...rest } = parsed.data;
    const product = await prisma.product.create({
      data: {
        ...rest,
        images: JSON.stringify(images),
        categories: { connect: categories.map((id) => ({ id })) },
      },
    });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
