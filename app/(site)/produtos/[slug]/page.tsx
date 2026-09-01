// app/(site)/produtos/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

function parseImages(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product || !product.available) notFound();

  const image = parseImages(product.images)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-cream">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-magenta">{formatBRL(Number(product.price))}</p>
          <p className="mt-4 leading-relaxed text-gray-700">{product.description}</p>
          {product.stock <= 0 ? (
            <p className="mt-6 rounded bg-clay px-4 py-2 font-semibold text-white">Esgotado</p>
          ) : (
            <div className="mt-6">
              <p className="mb-2 text-sm text-gray-500">{product.stock} em estoque</p>
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                image={image}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
