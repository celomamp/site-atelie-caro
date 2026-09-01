// app/(admin)/admin/(protected)/pedidos/page.tsx
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";

export const dynamic = "force-dynamic";

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
