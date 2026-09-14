import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEncomendaPayload } from "@/lib/encomendas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = parseEncomendaPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    const order = await prisma.customOrder.create({
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact,
        description: parsed.data.description,
        images: JSON.stringify(parsed.data.images),
        referenceSlug: parsed.data.referenceSlug,
        referenceName: parsed.data.referenceName,
      },
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
