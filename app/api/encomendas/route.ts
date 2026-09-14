import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const referenceSlug =
      typeof body.referenceSlug === "string" && body.referenceSlug.trim()
        ? body.referenceSlug.trim()
        : typeof body.ref === "string" && body.ref.trim()
          ? body.ref.trim()
          : null;
    const referenceName =
      typeof body.referenceName === "string" && body.referenceName.trim()
        ? body.referenceName.trim()
        : null;
    const order = await prisma.customOrder.create({
      data: {
        name: body.name,
        contact: body.contact,
        description: body.description,
        referenceSlug,
        referenceName,
      },
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
