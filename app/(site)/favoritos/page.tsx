// app/(site)/favoritos/page.tsx
import { prisma } from "@/lib/prisma";
import ProductsGrid from "@/components/ProductsGrid";
import { parseImages } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function FavoritosPage() {
  const products = await prisma.product.findMany({
    where: { available: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Meus favoritos</h1>
      <p className="mt-2 text-gray-600">
        Seus produtos favoritados neste navegador — sem precisar de conta.
      </p>
      <div className="mt-6">
        <ProductsGrid
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            price: Number(p.price),
            images: parseImages(p.images),
            available: p.available,
            stock: p.stock,
          }))}
          initialOnlyFavorites
        />
      </div>
    </div>
  );
}
