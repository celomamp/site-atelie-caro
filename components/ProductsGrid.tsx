"use client";
import { useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "./FavoritesContext";
import { filterFavoriteSlugs } from "@/lib/favorites";

export type GridProduct = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  available: boolean;
  stock: number;
};

export default function ProductsGrid({
  products,
  initialOnlyFavorites = false,
}: {
  products: GridProduct[];
  initialOnlyFavorites?: boolean;
}) {
  const { favorites, loaded } = useFavorites();
  const [onlyFavorites, setOnlyFavorites] = useState(initialOnlyFavorites);

  const visible = onlyFavorites
    ? filterFavoriteSlugs(products, favorites)
    : products;

  return (
    <div>
      <div className="mt-2 flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-cobalt px-3 py-1 text-sm">
          <input
            type="checkbox"
            checked={onlyFavorites}
            onChange={(e) => setOnlyFavorites(e.target.checked)}
            aria-label="Somente favoritos"
          />
          Somente favoritos
          {loaded && favorites.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-magenta text-xs font-bold text-white">
              {favorites.length}
            </span>
          )}
        </label>
        {onlyFavorites && (
          <Link href="/favoritos" className="text-sm text-cobalt underline">
            Ver página de favoritos
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-gray-500">
          {onlyFavorites ? (
            <>
              Nenhum favorito por aqui ainda.{" "}
              <Link href="/produtos" className="text-cobalt underline">
                Ver produtos
              </Link>
            </>
          ) : (
            "Nenhum produto encontrado."
          )}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <div key={p.slug} className="relative flex flex-col">
              <ProductCard
                product={{
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  images: p.images,
                  available: p.available,
                  stock: p.stock,
                }}
              />
              <FavoriteButton slug={p.slug} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
