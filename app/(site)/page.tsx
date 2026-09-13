// app/(site)/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import FavoriteButton from "@/components/FavoriteButton";

export const dynamic = "force-dynamic";

function parseImages(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true, available: true },
    take: 4,
  });
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const products = featured.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    images: parseImages(p.images),
    available: p.available,
  }));

  return (
    <div>
      <section className="bg-cobalt text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="font-cursive text-xl text-blush">Cerâmica artesanal</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">
            Peças únicas, <span className="text-blush">feitas à mão</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl">
            Cerâmica de alta temperatura produzida artesanalmente no Ateliê Carô.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/produtos" className="rounded bg-magenta px-6 py-3 font-semibold">
              Ver produtos
            </Link>
            <Link href="/encomendas" className="rounded border border-white px-6 py-3 font-semibold">
              Encomendar
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 grid gap-4 text-center md:grid-cols-3">
          {categories.slice(0, 2).map((c) => (
            <Link key={c.id} href={`/produtos?categoria=${c.slug}`} className="rounded bg-blush p-6 hover:bg-pink-100">
              <h3 className="font-display text-xl">{c.name}</h3>
            </Link>
          ))}
          <Link href="/encomendas" className="rounded bg-blush p-6 hover:bg-pink-100">
            <h3 className="font-display text-xl">Encomendas</h3>
          </Link>
          {categories.length > 2 && (
            <Link href="/produtos" className="rounded bg-blush p-6 hover:bg-pink-100 md:col-span-2">
              <h3 className="font-display text-xl">Ver todas as categorias</h3>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 font-display text-3xl font-bold">Destaques</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {products.map((p) => (
            <div key={p.slug} className="relative">
              <ProductCard product={p} />
              <FavoriteButton slug={p.slug} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 bg-terracotta text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold">Oficinas de Cerâmica</h2>
          <p className="mt-2">Venha colocar a mão na massa.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/oficinas" className="rounded bg-cobalt px-6 py-3 font-semibold">
              Ver oficinas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
