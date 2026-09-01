// app/(admin)/admin/(protected)/encomendas/page.tsx
"use client";
import { useEffect, useState } from "react";

type Encomenda = {
  id: string;
  name: string;
  contact: string;
  description: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["nova", "em_orcamento", "confirmada", "cancelada"];

export default function AdminEncomendasPage() {
  const [orders, setOrders] = useState<Encomenda[]>([]);

  useEffect(() => {
    fetch("/api/admin/encomendas")
      .then(async (r) => {
        if (r.ok) setOrders(await r.json());
      })
      .catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/encomendas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Encomendas</h1>
      <div className="mt-6 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{o.name}</p>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-500">{o.contact}</p>
            <p className="mt-2 text-sm">{o.description}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">Nenhuma encomenda.</p>}
      </div>
    </div>
  );
}
