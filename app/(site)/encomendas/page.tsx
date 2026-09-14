// app/(site)/encomendas/page.tsx
import EncomendaForm from "@/components/EncomendaForm";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function EncomendasPage({
  searchParams,
}: {
  searchParams?: { ref?: string };
}) {
  const products = await prisma.product.findMany({
    where: { available: true },
    orderBy: { name: "asc" },
  });
  const initialRefSlug =
    typeof searchParams?.ref === "string" && searchParams.ref.trim()
      ? searchParams.ref.trim()
      : null;
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
        <EncomendaForm
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            price: Number(p.price),
            images: parseImages(p.images),
          }))}
          initialRefSlug={initialRefSlug}
        />
      </div>
    </div>
  );
}
