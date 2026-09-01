"use client";
import { CartProvider } from "./CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
