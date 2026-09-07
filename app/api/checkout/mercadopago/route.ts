// app/api/checkout/mercadopago/route.ts
// Cria o pedido + preferência e devolve o init_point do Checkout Pro.
import { NextResponse } from "next/server";
import { CheckoutError, createMercadoPagoCheckout, getBaseUrl } from "@/lib/checkout";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createMercadoPagoCheckout({
      name: body.name,
      contact: body.contact,
      items: body.items,
      baseUrl: getBaseUrl(req),
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    if (e instanceof CheckoutError)
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Não foi possível iniciar o pagamento." },
      { status: 500 }
    );
  }
}
