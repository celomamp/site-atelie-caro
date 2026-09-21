// components/ProductCard.tsx
import Link from "next/link";
import { formatBRL } from "@/lib/cart";
import CardGallery from "@/components/CardGallery";
import { encomendaLink } from "@/lib/encomendas";

type Product = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  available: boolean;
  stock?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const stock = product.stock ?? 1;
  const soldOut = stock <= 0;
  const unique = !soldOut && stock <= 1;
  const href = `/produtos/${product.slug}`;

  return (
    <div className="group flex h-full flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md">
      <div className="relative">
        <Link href={href} className="block">
          <CardGallery images={product.images} alt={product.name} />
        </Link>
        {soldOut ? (
          <span className="absolute right-2 top-2 z-20 rounded bg-clay px-2 py-1 text-xs font-bold text-white">
            Esgotado
          </span>
        ) : unique ? (
          <span className="absolute right-2 top-2 z-20 rounded bg-magenta px-2 py-1 text-xs font-bold text-white">
            Peça única
          </span>
        ) : null}
        {soldOut && (
          <Link
            href={encomendaLink(product.slug)}
            className="absolute inset-x-2 bottom-2 z-20 rounded border border-magenta bg-white/95 px-3 py-2 text-center text-sm font-semibold text-magenta hover:bg-pink-50"
          >
            Encomende uma igual
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[3.5rem] font-display text-lg leading-7">
          <Link href={href} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-1 font-semibold text-magenta">
          {formatBRL(Number(product.price))}
        </p>
      </div>
    </div>
  );
}
