// app/api/checkout/mercadopago/route.ts
// Cria o pedido + preferência e devolve o init_point do Checkout Pro.
import { NextResponse } from "next/server";
import { CheckoutError, createMercadoPagoCheckout, FreightCheckoutError, getBaseUrl } from "@/lib/checkout";
import { hit, clientIp } from "@/lib/ratelimit";

export async function POST(req: Request) {
  try {
    const rl = await hit(`checkout:${clientIp(req)}`, {
      limit: 10,
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
    const result = await createMercadoPagoCheckout({
      name: body.name,
      contact: body.contact,
      email: body.email,
      deliveryMethod: body.deliveryMethod,
      address: body.address,
      serviceId: body.serviceId,
      items: body.items,
      baseUrl: getBaseUrl(req),
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    if (e instanceof FreightCheckoutError)
      return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    if (e instanceof CheckoutError)
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Não foi possível iniciar o pagamento." },
      { status: 500 }
    );
  }
}
