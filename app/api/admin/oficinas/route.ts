import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workshop = await prisma.workshop.create({ data: body });
    return NextResponse.json({ ok: true, workshop }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
