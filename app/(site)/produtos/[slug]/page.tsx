// app/(site)/produtos/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import { parseImages } from "@/lib/images";
import AddToCartButton from "@/components/AddToCartButton";
import FavoriteToggle from "@/components/FavoriteToggle";
import ProductGallery from "@/components/ProductGallery";
import Link from "next/link";
import { encomendaLink } from "@/lib/encomendas";

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
            <div className="mt-6">
              <p className="rounded bg-clay px-4 py-2 font-semibold text-white">Esgotado</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={encomendaLink(product.slug)}
                  className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700"
                >
                  Encomende uma igual
                </Link>
                <FavoriteToggle slug={product.slug} name={product.name} />
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="mb-2 text-sm text-gray-500">{product.stock} em estoque</p>
              <div className="flex flex-wrap gap-3">
                <AddToCartButton
                  slug={product.slug}
                  name={product.name}
                  price={Number(product.price)}
                  image={images[0]}
                />
                <FavoriteToggle slug={product.slug} name={product.name} />
                <Link
                  href={encomendaLink(product.slug)}
                  className="rounded border border-magenta px-6 py-3 font-semibold text-magenta hover:bg-pink-50"
                >
                  Personalize esse item
                </Link>
              </div>
            </div>
          )}
          <aside className="mt-6 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500">
            <p className="font-bold">Peças irmãs, não gêmeas.</p>
            <p className="mt-1">
              Peça artesanal: cada peça do Ateliê Carô é modelada, esmaltada e
              queimada à mão, uma a uma. Por isso, mesmo peças do mesmo lote
              podem apresentar pequenas diferenças de tonalidade, textura,
              tamanho e peso.
            </p>
            <p className="mt-1">
              As cores podem variar conforme a iluminação e a tela do seu dispositivo.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
