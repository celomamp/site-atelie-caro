import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderRecord } from "@/lib/orders";
import { validateAddress } from "@/lib/shipping";
import { hit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const rl = await hit(`orders:${clientIp(req)}`, {
      limit: 20,
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
    const body = await req.json();
    const record = buildOrderRecord(body.name, body.contact, body.items);

    // Campos de entrega (Task 6): legado sem deliveryMethod continua funcionando.
    const rawMethod = body.deliveryMethod;
    const hasDelivery = rawMethod === "envio" || rawMethod === "retirada";
    if (rawMethod !== undefined && !hasDelivery) {
      return NextResponse.json(
        { ok: false, error: "Informe a forma de entrega." },
        { status: 400 }
      );
    }
    const topEmail = typeof body.email === "string" ? body.email.trim() : "";
    const rawAddress =
      body.address !== null && typeof body.address === "object"
        ? body.address
        : {};
    const addressWithEmail =
      (rawAddress as Record<string, unknown>).email || !topEmail
        ? rawAddress
        : { ...(rawAddress as Record<string, unknown>), email: topEmail };
    const addr = hasDelivery
      ? validateAddress(rawMethod, addressWithEmail)
      : null;
    if (addr && !addr.ok) {
      return NextResponse.json({ ok: false, error: addr.error }, { status: 400 });
    }

    // Frete informado pelo client (cotação já exibida); WhatsApp não cobra online.
    const ship =
      body.shipping !== null && typeof body.shipping === "object"
        ? (body.shipping as Record<string, unknown>)
        : {};
    const shippingPrice =
      hasDelivery && rawMethod === "retirada"
        ? 0
        : typeof ship.price === "number" && Number.isFinite(ship.price)
          ? ship.price
          : null;
    const shippingServiceName =
      typeof ship.serviceName === "string" && ship.serviceName
        ? ship.serviceName
        : typeof body.shippingServiceName === "string"
          ? body.shippingServiceName
          : null;
    const shippingServiceId =
      typeof ship.serviceId === "string" && ship.serviceId
        ? ship.serviceId
        : typeof body.serviceId === "string"
          ? body.serviceId
          : null;
    const shippingEta =
      typeof ship.eta === "number" && Number.isFinite(ship.eta) ? ship.eta : null;

    const total =
      hasDelivery && addr?.ok
        ? Math.round((record.total + (shippingPrice ?? 0)) * 100) / 100
        : record.total;

    const order = await prisma.order.create({
      data: {
        ...record,
        items: JSON.stringify(record.items),
        total,
        paymentMethod: "whatsapp",
        ...(hasDelivery && addr?.ok
          ? {
              deliveryMethod: rawMethod,
              addressEmail: addr.address.email,
              addressCep: addr.address.cep,
              addressRua: addr.address.rua,
              addressNumero: addr.address.numero,
              addressCompl: addr.address.compl,
              addressRef: addr.address.ref,
              addressBairro: addr.address.bairro,
              addressCidade: addr.address.cidade,
              addressUf: addr.address.uf,
              shippingServiceId,
              shippingServiceName,
              shippingPrice,
              shippingEta,
            }
          : {}),
      },
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
