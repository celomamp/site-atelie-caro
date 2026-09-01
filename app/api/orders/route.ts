import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderRecord } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = buildOrderRecord(body.name, body.contact, body.items);
    const order = await prisma.order.create({
      data: { ...record, items: JSON.stringify(record.items) },
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
