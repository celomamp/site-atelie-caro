"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  toggleFavorite,
  isFavorite,
} from "@/lib/favorites";

type FavoritesCtx = {
  favorites: string[];
  count: number;
  loaded: boolean;
  isFavorite: (slug: string) => boolean;
  toggle: (slug: string) => void;
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesCtx | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) setFavorites(parseFavorites(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage may be unavailable (private mode/quota); ignore
    }
  }, [favorites, loaded]);

  const toggle = (slug: string) => {
    if (!slug) return;
    setFavorites((prev) => toggleFavorite(prev, slug));
  };

  const clear = () => setFavorites([]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        count: favorites.length,
        loaded,
        isFavorite: (slug: string) => isFavorite(favorites, slug),
        toggle,
        clear,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx)
    throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
