// app/api/mercadopago/webhook/route.ts
// Recebe notificações de pagamento do Mercado Pago (webhooks/IPN), valida a
// assinatura x-signature, consulta o pagamento na API e atualiza o pedido.
import { NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { parseWebhookNotification } from "@/lib/mercadopago";
import { applyMercadoPagoPaymentToOrder, fetchMercadoPagoPayment } from "@/lib/checkout";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const notification = parseWebhookNotification({
      searchParams: url.searchParams,
      body,
    });
    // Notificação de outro recurso (ou sem id): apenas confirma o recebimento.
    if (!notification) return NextResponse.json({ ok: true });

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (secret) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: req.headers.get("x-signature"),
          xRequestId: req.headers.get("x-request-id"),
          dataId: url.searchParams.get("data.id") ?? notification.paymentId,
          secret,
          toleranceSeconds: 300,
        });
      } catch (e) {
        if (e instanceof InvalidWebhookSignatureError) {
          console.error(
            `[webhook-mp] assinatura inválida: ${e.reason} (request-id: ${e.requestId ?? "?"})`
          );
          return NextResponse.json({ ok: false }, { status: 401 });
        }
        throw e;
      }
    } else if (process.env.NODE_ENV === "production") {
      console.warn(
        "[webhook-mp] MERCADO_PAGO_WEBHOOK_SECRET não configurado — aceitando notificação sem validação de assinatura."
      );
    }

    const payment = await fetchMercadoPagoPayment(notification.paymentId);
    await applyMercadoPagoPaymentToOrder(payment);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
