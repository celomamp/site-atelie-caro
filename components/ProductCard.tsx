// components/ProductCard.tsx
import Link from "next/link";
import { formatBRL } from "@/lib/cart";

type Product = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  available: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square bg-cream">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg">{product.name}</h3>
        <p className="mt-1 font-semibold text-magenta">{formatBRL(Number(product.price))}</p>
      </div>
    </Link>
  );
}
