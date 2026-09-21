// components/Hero.tsx
import Link from "next/link";

type HeroProduct = {
  slug: string;
  name: string;
  image: string | null;
};

export default function Hero({ product }: { product: HeroProduct | null }) {
  return (
    <section className="bg-cobalt text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div className="text-center md:text-left">
          <p className="font-cursive text-xl text-blush">Cerâmica artesanal de alta temperatura</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-blush sm:text-5xl md:text-6xl">
            Peças únicas, feitas à mão
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/90 md:mx-0">
            Cerâmica produzida artesanalmente no Ateliê Carô, em Campinas. Peças irmãs, não gêmeas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
            <Link
              href="/produtos"
              className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700"
            >
              Ver produtos
            </Link>
            <Link
              href="/encomendas"
              className="rounded border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Encomendar
            </Link>
          </div>
        </div>

        {product?.image && (
          <div className="mx-auto w-full max-w-sm md:max-w-md">
            <Link
              href={`/produtos/${product.slug}`}
              className="group block overflow-hidden rounded-2xl bg-blush shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
            <p className="mt-3 text-center text-sm text-white/80 md:text-right">
              {product.name}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
