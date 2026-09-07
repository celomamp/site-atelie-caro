// app/(site)/checkout/retorno/page.tsx
// Página de retorno do Checkout Pro: o Mercado Pago redireciona para cá com
// query params (collection_id, external_reference, status...). A página
// confirma o pagamento consultando a API do Mercado Pago (fallback caso o
// webhook ainda não tenha chegado), atualiza o pedido e mostra o resultado.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { applyMercadoPagoPaymentToOrder, fetchMercadoPagoPayment } from "@/lib/checkout";
import { orderStatusFromPaymentStatus } from "@/lib/mercadopago";
import { parseOrderItems } from "@/lib/orders";
import { formatBRL } from "@/lib/cart";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CheckoutRetornoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const paymentId = first(searchParams.collection_id) ?? first(searchParams.payment_id);
  const externalReference = first(searchParams.external_reference);
  const backStatus = first(searchParams.status) ?? first(searchParams.collection_status);

  let order = externalReference
    ? await prisma.order.findUnique({ where: { id: externalReference } })
    : null;

  // Confirmação autoritativa: consulta o pagamento na API do Mercado Pago.
  // Só atualiza o pedido se o external_reference do pagamento bate com o pedido.
  if (order && paymentId) {
    try {
      const payment = await fetchMercadoPagoPayment(paymentId);
      if (payment?.external_reference === order.id) {
        await applyMercadoPagoPaymentToOrder(payment);
        order = await prisma.order.findUnique({ where: { id: order.id } });
      }
    } catch (e) {
      console.error("[checkout-retorno] falha ao confirmar pagamento:", e);
    }
  }

  // Status efetivo: o banco manda quando já confirmado; se ainda está
  // "pending" no banco, usa o status informado pelo redirect do Mercado Pago.
  const effectiveStatus =
    order?.paymentStatus && order.paymentStatus !== "pending"
      ? order.paymentStatus
      : backStatus ?? order?.paymentStatus ?? null;
  const outcome = effectiveStatus
    ? orderStatusFromPaymentStatus(effectiveStatus)
    : "desconhecido";

  const items = order ? parseOrderItems(order.items) : [];
  const name = order?.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {outcome === "pago" && <ClearCartOnSuccess />}

      <div className="rounded-lg bg-white p-8 text-center shadow">
        {outcome === "pago" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">
              Pagamento aprovado{name ? `, ${name}` : ""}!
            </h1>
            <p className="mt-2 text-gray-600">
              Recebemos seu pagamento e seu pedido está confirmado. Obrigada pela
              compra!
            </p>
          </>
        )}

        {outcome === "aguardando_pagamento" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                <path strokeLinecap="round" d="M12 7v5l3 3" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">Pagamento pendente</h1>
            <p className="mt-2 text-gray-600">
              Assim que o pagamento for confirmado (por exemplo, Pix ou boleto),
              seu pedido será atualizado automaticamente.
            </p>
          </>
        )}

        {outcome === "pagamento_reprovado" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">Pagamento não aprovado</h1>
            <p className="mt-2 text-gray-600">
              Não foi possível aprovar o pagamento. Seu carrinho continua salvo —
              você pode tentar novamente.
            </p>
            <Link
              href="/carrinho"
              className="mt-6 inline-block rounded bg-cobalt px-6 py-3 font-semibold text-white"
            >
              Voltar ao carrinho
            </Link>
          </>
        )}

        {outcome === "pagamento_cancelado" && (
          <>
            <h1 className="font-display text-3xl font-bold">Pagamento cancelado</h1>
            <p className="mt-2 text-gray-600">
              O pagamento foi cancelado. Se mudar de ideia, seu carrinho continua
              salvo para você tentar novamente.
            </p>
            <Link
              href="/carrinho"
              className="mt-6 inline-block rounded bg-cobalt px-6 py-3 font-semibold text-white"
            >
              Voltar ao carrinho
            </Link>
          </>
        )}

        {outcome === "reembolsado" && (
          <>
            <h1 className="font-display text-3xl font-bold">Pagamento reembolsado</h1>
            <p className="mt-2 text-gray-600">
              O valor deste pedido foi devolvido. Se tiver dúvidas, fale com a
              gente pela página de contato.
            </p>
          </>
        )}

        {outcome === "desconhecido" && (
          <>
            <h1 className="font-display text-3xl font-bold">
              Não conseguimos confirmar seu pagamento
            </h1>
            <p className="mt-2 text-gray-600">
              Se você concluiu o pagamento, aguarde alguns instantes — o pedido é
              atualizado automaticamente pela confirmação do Mercado Pago. Em caso
              de dúvidas, fale com a gente pela página de contato.
            </p>
          </>
        )}

        {order && items.length > 0 && (
          <div className="mt-8 rounded border border-gray-200 p-4 text-left">
            <p className="font-semibold">Pedido #{order.id.slice(-8)}</p>
            <ul className="mt-2 text-sm text-gray-600">
              {items.map((it) => (
                <li key={it.slug}>
                  • {it.name} — {it.qty}x — {formatBRL(it.unitPrice * it.qty)}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-gray-100 pt-2 text-sm">
              Total: <span className="font-bold text-magenta">{formatBRL(Number(order.total))}</span>
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link href="/produtos" className="font-semibold text-cobalt hover:underline">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
