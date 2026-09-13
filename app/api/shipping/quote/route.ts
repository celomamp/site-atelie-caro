// app/api/shipping/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCep, buildMeQuotePayload, parseMeQuoteResponse, meApiBase } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const toCep = normalizeCep(body.cep);
    if (!toCep) return NextResponse.json({ ok: false, error: "Informe um CEP válido com 8 dígitos." }, { status: 400 });
    const rawItems: Array<any> = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return NextResponse.json({ ok: false, error: "Seu carrinho está vazio." }, { status: 400 });
    const slugs = [...new Set(rawItems.map((i: any) => String(i.slug)).filter(Boolean))];
    const products = await prisma.product.findMany({ where: { slug: { in: slugs }, available: true } });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const meProducts: any[] = [];
    for (const raw of rawItems) {
      const p = bySlug.get(String(raw.slug));
      const qty = Number(raw.qty);
      if (!p || !Number.isInteger(qty) || qty < 1) return NextResponse.json({ ok: false, error: "Produto indisponível no carrinho." }, { status: 400 });
      meProducts.push({ weight: Number((p as any).weight ?? 2), width: Number((p as any).width ?? 30), height: Number((p as any).height ?? 20), length: Number((p as any).length ?? 20), insurance_value: Math.round(Number(p.price) * 100) / 100, quantity: qty });
    }
    const fromCep = (process.env.MELHOR_ENVIO_ORIGEM_CEP ?? "").replace(/\D/g, "");
    const token = process.env.MELHOR_ENVIO_TOKEN ?? "";
    if (!fromCep || !token) return NextResponse.json({ ok: false, error: "Frete indisponível no momento. Conclua como frete a combinar." }, { status: 502 });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${meApiBase(process.env.MELHOR_ENVIO_AMBIENTE)}/api/v2/me/shipment/calculate`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "User-Agent": "Atelie Caro (contato@ateliecaro.com.br)" },
        body: JSON.stringify(buildMeQuotePayload({ fromCep, toCep, products: meProducts })),
        signal: ctrl.signal,
      });
      if (!res.ok) return NextResponse.json({ ok: false, error: "Não foi possível cotar o frete. Tente de novo ou conclua como frete a combinar." }, { status: 502 });
      const options = parseMeQuoteResponse(await res.json());
      return NextResponse.json({ ok: true, options });
    } finally { clearTimeout(t); }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Não foi possível cotar o frete." }, { status: 500 });
  }
}
