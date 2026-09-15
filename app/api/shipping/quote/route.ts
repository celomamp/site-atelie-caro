// app/api/shipping/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hit, clientIp } from "@/lib/ratelimit";
import { normalizeCep } from "@/lib/shipping";
import {
  getShippingOptions,
  ShippingQuoteError,
  toMeProduct,
} from "@/lib/shipping-quote";

export async function POST(req: Request) {
  try {
    const rl = await hit(`shipping-quote:${clientIp(req)}`, {
      limit: 30,
      windowMs: 600000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Muitas tentativas. Tente novamente em instantes.",
          retryAfter: rl.retryAfter,
        },
        { status: 429 }
      );
    }
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
      meProducts.push(toMeProduct(p as any, qty));
    }
    try {
      const options = await getShippingOptions(toCep, meProducts);
      return NextResponse.json({ ok: true, options });
    } catch (e) {
      if (e instanceof ShippingQuoteError)
        return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
      throw e;
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Não foi possível cotar o frete." }, { status: 500 });
  }
}
