"use client";
import { CartProvider } from "./CartContext";
import { FavoritesProvider } from "./FavoritesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </CartProvider>
  );
}
