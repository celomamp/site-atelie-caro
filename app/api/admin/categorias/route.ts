import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation, requireAdmin } from "@/lib/admin-guard";
import { categorySchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
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
    const category = await prisma.category.create({ data: parsed.data });
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
