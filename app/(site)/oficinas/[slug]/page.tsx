// app/(site)/oficinas/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import { SITE } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function WorkshopDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const workshop = await prisma.workshop.findUnique({
    where: { slug: params.slug },
  });

  if (!workshop || !workshop.active) notFound();

  const spots = workshop.maxAttendees - workshop.spotsTaken;
  const message = [
    `Olá, Ateliê Carô! Quero me inscrever na oficina "${workshop.title}"`,
    `em ${new Date(workshop.date).toLocaleDateString("pt-BR")} (${SITE.address}).`,
    "",
    "Nome: [seu nome]",
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {workshop.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workshop.image} alt={workshop.title} className="h-64 w-full object-cover" />
        )}
        <div className="p-6">
          <h1 className="font-display text-4xl font-bold">{workshop.title}</h1>
          <p className="mt-4 leading-relaxed text-gray-700">{workshop.description}</p>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            <p>📅 Data: {new Date(workshop.date).toLocaleDateString("pt-BR")}</p>
            <p>⏱ Duração: {workshop.duration} minutos</p>
            <p>📍 Local: {workshop.location}</p>
            <p>👥 Vagas: {spots} restantes de {workshop.maxAttendees}</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-2xl font-bold text-magenta">{formatBRL(Number(workshop.price))}</p>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-cobalt px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Inscrever-se pelo WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
