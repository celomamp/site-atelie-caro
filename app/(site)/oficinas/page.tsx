// app/(site)/oficinas/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function OficinasPage() {
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Oficinas de Cerâmica</h1>
      <p className="mt-2 text-gray-600">Coloque a mão na massa e aprenda cerâmica artesanal.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {workshops.map((w) => (
          <Link key={w.slug} href={`/oficinas/${w.slug}`} className="rounded-lg bg-white p-6 shadow hover:shadow-md">
            <h3 className="font-display text-2xl font-bold">{w.title}</h3>
            <p className="mt-3 text-sm text-gray-600">
              📅 {new Date(w.date).toLocaleDateString("pt-BR")} · ⏱ {w.duration} min · 📍 {w.location}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-bold text-magenta">{formatBRL(Number(w.price))}</p>
              <p className="text-sm text-gray-500">
                {w.maxAttendees - w.spotsTaken} vagas restantes
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
