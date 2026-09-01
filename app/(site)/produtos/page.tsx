// app/(site)/produtos/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "utensilios", label: "Utensílios" },
  { value: "decoracao", label: "Decoração" },
  { value: "vasos", label: "Vasos" },
];

function parseImages(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; ordenar?: string };
}) {
  const cat = searchParams.categoria;
  const order = searchParams.ordenar;

  const products = await prisma.product.findMany({
    where: { available: true, ...(cat ? { category: cat } : {}) },
    orderBy:
      order === "menor"
        ? { price: "asc" }
        : order === "maior"
        ? { price: "desc" }
        : { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Produtos</h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/produtos" className="rounded border border-cobalt px-3 py-1 text-sm">Todos</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/produtos?categoria=${c.value}`}
              className={`rounded border px-3 py-1 text-sm ${
                cat === c.value ? "bg-cobalt text-white" : "border-cobalt"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <SortSelect categoria={cat} ordenar={order} />
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.slug} className="relative">
              <ProductCard
                product={{
                  slug: p.slug,
                  name: p.name,
                  price: Number(p.price),
                  images: parseImages(p.images),
                  available: p.available,
                }}
              />
              {p.stock <= 0 && (
                <span className="absolute right-2 top-2 rounded bg-clay px-2 py-1 text-xs font-bold text-white">
                  Esgotado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
