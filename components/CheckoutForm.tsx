"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import { buildWhatsAppOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/cart";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

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
          onClick={handleSend}
          className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700"
        >
          Enviar pedido pelo WhatsApp
        </button>
      </div>
    </div>
  );
}
