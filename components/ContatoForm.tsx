// components/ContatoForm.tsx
"use client";
import { useState } from "react";
import { whatsappLink } from "@/lib/whatsapp";

export default function ContatoForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    if (!name.trim()) {
      setError("Informe seu nome para continuar.");
      return;
    }
    if (!message.trim()) {
      setError("Escreva sua mensagem para continuar.");
      return;
    }
    setError(null);
    const text = [
      "Olá, Ateliê Carô!",
      "",
      `Meu nome é ${name.trim()}:`,
      "",
      message.trim(),
    ].join("\n");
    window.open(whatsappLink(text), "_blank");
    setName("");
    setMessage("");
  }

  return (
    <form
      className="rounded-lg bg-white p-6 shadow"
      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
    >
      <h2 className="font-display text-xl">Mande uma mensagem</h2>
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="contato-nome" className="text-sm font-semibold">Seu nome</label>
          <input id="contato-nome" name="nome" autoComplete="name" className="rounded border border-gray-300 px-3 py-2" placeholder="Seu nome" value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="contato-mensagem" className="text-sm font-semibold">Mensagem</label>
          <textarea id="contato-mensagem" name="mensagem" className="rounded border border-gray-300 px-3 py-2" rows={5} placeholder="Como podemos ajudar?"
            value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}
        <button className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700">
          Enviar pelo WhatsApp
        </button>
      </div>
    </form>
  );
}
