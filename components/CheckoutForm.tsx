"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import { buildWhatsAppOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/cart";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSend() {
    const message = buildWhatsAppOrderMessage(items);
    window.open(whatsappLink(message), "_blank");
    if (name && contact) {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, items }),
      }).catch(() => {});
    }
    clear();
  }

  async function handleMercadoPago() {
    setError(null);
    if (!name.trim()) {
      setError("Informe seu nome para continuar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.initPoint)
        throw new Error(data.error || "Não foi possível iniciar o pagamento.");
      window.location.href = data.initPoint;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao iniciar pagamento. Tente novamente."
      );
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="font-display text-xl font-bold">Finalizar pedido</h2>
      <div className="mt-4 flex flex-col gap-3">
        <input
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="WhatsApp (opcional)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          Total: <span className="font-bold text-magenta">{formatBRL(total)}</span>
        </p>
        <button
          onClick={handleMercadoPago}
          disabled={loading || items.length === 0}
          className="rounded bg-[#009EE3] px-6 py-3 font-semibold text-white hover:bg-[#0079B2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Redirecionando…" : "Pagar com Mercado Pago"}
        </button>
        <p className="text-xs text-gray-500">
          Cartão, Pix, boleto ou conta Mercado Pago — você será redirecionado
          para concluir o pagamento com segurança.
        </p>
        <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          ou
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <button
          onClick={handleSend}
          className="rounded border-2 border-magenta px-6 py-3 font-semibold text-magenta hover:bg-pink-50"
        >
          Enviar pedido pelo WhatsApp
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
