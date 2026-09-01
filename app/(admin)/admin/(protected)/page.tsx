// app/(admin)/admin/(protected)/page.tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders, customOrders, workshops] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.customOrder.count({ where: { status: "nova" } }),
    prisma.workshop.count({ where: { active: true } }),
  ]);

  const stats = [
    { label: "Produtos", value: products },
    { label: "Pedidos", value: orders },
    { label: "Encomendas novas", value: customOrders },
    { label: "Oficinas ativas", value: workshops },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-6 shadow">
            <p className="text-3xl font-bold text-cobalt">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
