// app/(site)/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/images";
import ProductCard from "@/components/ProductCard";
import FavoriteButton from "@/components/FavoriteButton";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import CategoryShowcase, { type CategoryItem } from "@/components/CategoryShowcase";
import StorySection from "@/components/StorySection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: { available: true },
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const withImages = allProducts
    .map((p) => ({ product: p, images: parseImages(p.images) }))
    .filter((entry) => entry.images.length > 0);

  const featured = withImages.filter((entry) => entry.product.featured);
  const curated = (featured.length > 0 ? featured : withImages).slice(0, 8);
  const curatedTitle = featured.length > 0 ? "Destaques" : "Novidades";

  const heroEntry = featured[0] ?? withImages[0] ?? null;
  const heroProduct = heroEntry
    ? {
        slug: heroEntry.product.slug,
        name: heroEntry.product.name,
        image: heroEntry.images[0],
      }
    : null;

  const storyImages = withImages
    .filter((entry) => entry.product.slug !== heroEntry?.product.slug)
    .slice(0, 2)
    .map((entry) => entry.images[0]);

  const categoryImage = new Map<string, string>();
  for (const entry of withImages) {
    for (const category of entry.product.categories) {
      if (!categoryImage.has(category.id)) {
        categoryImage.set(category.id, entry.images[0]);
      }
    }
  }
  const categoryItems: CategoryItem[] = categories.slice(0, 6).map((c) => ({
    slug: c.slug,
    name: c.name,
    image: categoryImage.get(c.id) ?? null,
  }));

  return (
    <div>
      <Hero product={heroProduct} />
      <TrustBar />

      <CategoryShowcase categories={categoryItems} />

      {curated.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold">{curatedTitle}</h2>
            <Link href="/produtos" className="text-sm font-semibold text-cobalt underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {curated.map((entry) => {
              const { product, images } = entry;
              return (
                <div key={product.slug} className="relative flex flex-col">
                  <ProductCard
                    product={{
                      slug: product.slug,
                      name: product.name,
                      price: Number(product.price),
                      images,
                      available: product.available,
                    }}
                  />
                  <FavoriteButton slug={product.slug} />
                  {product.stock <= 0 ? (
                    <span className="absolute right-2 top-2 rounded bg-clay px-2 py-1 text-xs font-bold text-white">
                      Esgotado
                    </span>
                  ) : product.stock <= 1 ? (
                    <span className="absolute right-2 top-2 rounded bg-magenta px-2 py-1 text-xs font-bold text-white">
                      Peça única
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <StorySection images={storyImages} />

      <section className="bg-cobalt text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">Peça única sob medida</h2>
            <p className="mt-2 text-white/90">
              Escolha uma peça de referência, conte o que você imagina e receba um
              orçamento. Ideal para presentes, casa nova e coleções.
            </p>
          </div>
          <div className="md:text-right">
            <Link
              href="/encomendas"
              className="inline-block rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700"
            >
              Encomendar
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-cobalt">Oficinas de Cerâmica</h2>
          <p className="mt-2 text-ink/80">Venha colocar a mão na massa.</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/oficinas"
              className="rounded bg-cobalt px-6 py-3 font-semibold text-white hover:bg-cobalt/90"
            >
              Ver oficinas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
