// app/(admin)/admin/(protected)/encomendas/page.tsx
"use client";
import { useCallback, useEffect, useState } from "react";
import { filterEncomendasByStatus } from "@/lib/encomendas";

type Encomenda = {
  id: string;
  name: string;
  contact: string;
  description: string;
  images?: string | null;
  referenceSlug?: string | null;
  referenceName?: string | null;
  status: string;
  createdAt: string;
};

function parseOrderImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

function contactHref(contact: string): string | null {
  const digits = contact.replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

const STATUSES = ["nova", "em_orcamento", "confirmada", "cancelada"];

export default function AdminEncomendasPage() {
  const [orders, setOrders] = useState<Encomenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("todas");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch("/api/admin/encomendas", { cache: "no-store" });
      if (!r.ok) throw new Error(`GET /api/admin/encomendas: ${r.status}`);
      setOrders(await r.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/encomendas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert("Não foi possível atualizar o status.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const visible = filterEncomendasByStatus(orders, filter);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Encomendas</h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded border border-cobalt px-4 py-2 text-sm font-semibold text-cobalt hover:bg-blue-50 disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["todas", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={`rounded border px-3 py-1 text-sm ${
              filter === s ? "bg-cobalt text-white" : "border-cobalt"
            }`}
          >
            {s === "todas" ? `Todas (${orders.length})` : s}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {loading && <p className="text-gray-500">Carregando encomendas...</p>}
        {!loading && error && (
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="font-semibold text-red-600">Não foi possível carregar as encomendas.</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 rounded border border-cobalt px-4 py-2 text-sm font-semibold text-cobalt hover:bg-blue-50"
            >
              Tentar novamente
            </button>
          </div>
        )}
        {!loading && !error && visible.map((o) => (
          <div key={o.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{o.name}</p>
              <select
                value={o.status}
                aria-label={`Status da encomenda de ${o.name}`}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-400">{formatDate(o.createdAt)}</p>
            <p className="mt-1 text-sm text-gray-500">
              {contactHref(o.contact) ? (
                <a href={contactHref(o.contact)!} target="_blank" rel="noreferrer" className="text-cobalt underline">
                  {o.contact}
                </a>
              ) : (
                o.contact
              )}
            </p>
            {(o.referenceSlug || o.referenceName) && (
              <p className="mt-1 text-sm text-gray-600">
                Referência:{" "}
                {o.referenceSlug ? (
                  <a
                    href={`/produtos/${o.referenceSlug}`}
                    className="text-cobalt underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {o.referenceName || o.referenceSlug}
                  </a>
                ) : (
                  o.referenceName
                )}
              </p>
            )}
            <p className="mt-2 text-sm"><span className="font-semibold">Descrição: </span>{o.description}</p>
            {parseOrderImages(o.images).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {parseOrderImages(o.images).map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Imagem de referência da encomenda" className="h-20 w-20 rounded object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {!loading && !error && visible.length === 0 && (
          <p className="text-gray-500">
            {orders.length === 0
              ? "Nenhuma encomenda por aqui ainda."
              : `Nenhuma encomenda com status "${filter}".`}
          </p>
        )}
      </div>
    </div>
  );
}
