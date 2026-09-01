import Link from "next/link";
import { SITE } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Contato</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">WhatsApp</h3>
          <p className="mt-2 text-sm">{SITE.whatsapp}</p>
          <a href={whatsappLink("Olá, Ateliê Carô!")} target="_blank" rel="noreferrer"
            className="mt-4 inline-block rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white">
            Falar com a gente
          </a>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Instagram</h3>
          <p className="mt-2 text-sm">{SITE.instagram}</p>
          <a href={SITE.instagram} target="_blank" rel="noreferrer"
            className="mt-4 inline-block rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white">
            Seguir no Instagram
          </a>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Endereço</h3>
          <p className="mt-2 text-sm">{SITE.address}</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Horários</h3>
          <p className="mt-2 text-sm">{SITE.hours}</p>
        </div>
      </div>
    </div>
  );
}
