export const FAVORITES_STORAGE_KEY = "atelie-caro-favorites";

export function parseFavorites(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is string => typeof item === "string" && item.length > 0
    );
  }
  if (typeof raw !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is string => typeof item === "string" && item.length > 0
    );
  } catch {
    return [];
  }
}

export function toggleFavorite(favorites: string[], slug: string): string[] {
  if (favorites.includes(slug)) {
    return favorites.filter((s) => s !== slug);
  }
  return [...favorites, slug];
}

export function isFavorite(favorites: string[], slug: string): boolean {
  return favorites.includes(slug);
}

export function filterFavoriteSlugs<T extends { slug: string }>(
  products: T[],
  favorites: string[]
): T[] {
  if (favorites.length === 0) return [];
  const set = new Set(favorites);
  return products.filter((p) => set.has(p.slug));
}
