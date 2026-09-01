// app/(site)/encomendas/page.tsx
import EncomendaForm from "@/components/EncomendaForm";

export default function EncomendasPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Encomendas Personalizadas</h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Quer uma peça única? Descreva o que você imagina e enviamos um orçamento pelo WhatsApp.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">1. Descreva</h3>
          <p className="mt-2 text-sm">Conte o tipo, tamanho, cores e uso da peça.</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">2. Receba o orçamento</h3>
          <p className="mt-2 text-sm">Respondemos com preço e prazo pelo WhatsApp.</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">3. Aprove</h3>
          <p className="mt-2 text-sm">Confirmamos a produção da sua peça exclusiva.</p>
        </div>
      </div>
      <div className="mt-8">
        <EncomendaForm />
      </div>
    </div>
  );
}
