import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardAdminMutation } from "@/lib/admin-guard";
import { workshopCreateSchema } from "@/lib/admin-schemas";

export async function POST(req: Request) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const parsed = workshopCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const workshop = await prisma.workshop.create({ data: parsed.data });
    return NextResponse.json({ ok: true, workshop }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
