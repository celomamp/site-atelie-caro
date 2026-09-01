"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { CartItem } from "@/lib/cart";

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | undefined>(undefined);
const STORAGE_KEY = "atelie-caro-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  const addItem = (item: CartItem) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug);
      if (existing)
        return prev.map((i) =>
          i.slug === item.slug ? { ...i, qty: i.qty + item.qty } : i
        );
      return [...prev, item];
    });

  const removeItem = (slug: string) =>
    setItems((prev) => prev.filter((i) => i.slug !== slug));

  const setQty = (slug: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
    );

  const clear = () => setItems([]);

  return (
    <CartContext.Provider
      value={{ items, count, total, addItem, removeItem, setQty, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
