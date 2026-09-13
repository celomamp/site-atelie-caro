"use client";
import { useFavorites } from "./FavoritesContext";

export default function FavoriteButton({ slug }: { slug: string }) {
  const { isFavorite, toggle, loaded } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={active}
      title={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={`absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
        active
          ? "bg-magenta text-white"
          : "bg-white/90 text-cobalt hover:bg-white"
      } ${loaded ? "" : "opacity-50"}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
