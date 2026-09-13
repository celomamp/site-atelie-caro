"use client";
import { useFavorites } from "./FavoritesContext";

export default function FavoriteToggle({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={
        active
          ? `Remover ${name} dos favoritos`
          : `Adicionar ${name} aos favoritos`
      }
      className={`inline-flex items-center gap-2 rounded border px-4 py-2 font-semibold transition ${
        active
          ? "border-magenta bg-magenta text-white"
          : "border-cobalt text-cobalt hover:bg-blush"
      }`}
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
      {active ? "Favoritado" : "Favoritar"}
    </button>
  );
}
