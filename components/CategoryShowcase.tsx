// components/CategoryShowcase.tsx
import Link from "next/link";

export type CategoryItem = {
  slug: string;
  name: string;
  image: string | null;
};

export default function CategoryShowcase({ categories }: { categories: CategoryItem[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-3xl text-ink">Categorias</h2>
        <Link href="/produtos" className="text-sm font-semibold text-cobalt underline">
          Ver todos os produtos
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/produtos?categoria=${c.slug}`}
            className="group relative overflow-hidden rounded-lg bg-blush"
          >
            {c.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={c.image}
                alt={c.name}
                className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="aspect-[4/3] w-full" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-cobalt/80 via-cobalt/10 to-transparent" />
            <h3 className="absolute bottom-3 left-3 right-3 font-display text-lg text-white">
              {c.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
