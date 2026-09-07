// app/(site)/produtos/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import { parseImages } from "@/lib/images";
import AddToCartButton from "@/components/AddToCartButton";
import ProductGallery from "@/components/ProductGallery";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product || !product.available) notFound();

  const images = parseImages(product.images);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} alt={product.name} />
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
                image={images[0]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
