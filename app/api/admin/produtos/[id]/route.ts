// app/api/admin/produtos/[id]/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { productUpdateSchema } from "@/lib/admin-schemas";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = productUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const { categories, images, ...rest } = parsed.data;
    const data: Prisma.ProductUpdateInput = { ...rest };
    if (images !== undefined) data.images = JSON.stringify(images);
    if (categories !== undefined) {
      data.categories = { set: categories.map((id) => ({ id })) };
    }
    const product = await prisma.product.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
