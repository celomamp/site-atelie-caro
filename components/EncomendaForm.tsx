// components/EncomendaForm.tsx
"use client";
import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";

export default function EncomendaForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [desc, setDesc] = useState("");

  function handleSend() {
    const message = [
      "Olá, Ateliê Carô! Gostaria de solicitar um orçamento de encomenda:",
      "",
      `Nome: ${name}`,
      `Contato: ${contact}`,
      "",
      "Descrição da peça:",
      desc,
    ].join("\n");
    window.open(whatsappLink(message), "_blank");
    if (name && contact && desc) {
      fetch("/api/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, description: desc }),
      }).catch(() => {});
    }
    setName(""); setContact(""); setDesc("");
  }

  return (
    <form
      className="rounded-lg bg-white p-6 shadow"
      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-nome" className="text-sm font-semibold">Seu nome</label>
          <input id="encomenda-nome" name="nome" autoComplete="name" className="rounded border border-gray-300 px-3 py-2" placeholder="Seu nome" value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-contato" className="text-sm font-semibold">WhatsApp / contato</label>
          <input id="encomenda-contato" name="contato" autoComplete="tel" className="rounded border border-gray-300 px-3 py-2" placeholder="WhatsApp / contato" value={contact}
            onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-desc" className="text-sm font-semibold">Descrição da peça</label>
          <textarea id="encomenda-desc" name="descricao" className="rounded border border-gray-300 px-3 py-2" rows={5} placeholder="Descreva a peça que você quer (tipo, tamanho, cores...)"
            value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <button className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700">
          Solicitar orçamento pelo WhatsApp
        </button>
      </div>
    </form>
  );
}
