// app/(site)/produtos/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SortSelect from "@/components/SortSelect";
import ProductsGrid from "@/components/ProductsGrid";
import { parseImages } from "@/lib/images";
import { productOrderBy } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; ordenar?: string; favoritos?: string };
}) {
  const cat = searchParams.categoria;
  const order = searchParams.ordenar;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const selected = categories.find((c) => c.slug === cat);

  const products = await prisma.product.findMany({
    where: {
      available: true,
      ...(selected ? { categories: { some: { id: selected.id } } } : {}),
    },
    orderBy: productOrderBy(order),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Produtos</h1>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto [scrollbar-width:thin]">
          <Link href="/produtos" className="shrink-0 whitespace-nowrap rounded border border-cobalt px-3 py-1 text-sm">Todos</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/produtos?categoria=${c.slug}`}
              className={`shrink-0 whitespace-nowrap rounded border px-3 py-1 text-sm ${
                selected?.id === c.id ? "bg-cobalt text-white" : "border-cobalt"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="shrink-0">
          <SortSelect categoria={cat} ordenar={order} favoritos={searchParams.favoritos} />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <ProductsGrid
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            price: Number(p.price),
            images: parseImages(p.images),
            available: p.available,
            stock: p.stock,
          }))}
          initialOnlyFavorites={searchParams.favoritos === "1"}
        />
      )}
    </div>
  );
}
