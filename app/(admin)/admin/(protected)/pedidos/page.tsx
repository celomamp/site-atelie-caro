// app/(admin)/admin/(protected)/pedidos/page.tsx
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";

export const dynamic = "force-dynamic";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pago":
    case "recebido":
      return "bg-green-100 text-green-800";
    case "aguardando_pagamento":
      return "bg-yellow-100 text-yellow-800";
    case "pagamento_reprovado":
    case "pagamento_cancelado":
      return "bg-red-100 text-red-800";
    case "reembolsado":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <div className="mt-6 space-y-4">
        {orders.map((o) => {
          let items: any[] = [];
          try {
            items = JSON.parse(o.items) || [];
          } catch {
            items = [];
          }
          return (
            <div key={o.id} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{o.name} <span className="text-gray-500">({o.contact})</span></p>
                <p className="font-bold text-magenta">{formatBRL(Number(o.total))}</p>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-medium ${statusBadgeClass(o.status)}`}>
                  {o.status}
                </span>
                {o.paymentMethod === "mercadopago" && (
                  <span className="rounded-full bg-[#E0F4FB] px-2 py-0.5 font-medium text-[#0079B2]">
                    Mercado Pago{o.paymentStatus ? ` · ${o.paymentStatus}` : ""}
                  </span>
                )}
                <span className="text-gray-400">
                  {new Date(o.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {items.map((it, i) => (
                  <li key={i}>• {it.name} — {it.qty}x — {formatBRL(Number(it.unitPrice) * it.qty)}</li>
                ))}
              </ul>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-gray-500">Nenhum pedido.</p>}
      </div>
    </div>
  );
}
