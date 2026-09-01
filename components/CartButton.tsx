// components/CartButton.tsx
"use client";
import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/carrinho" className="relative inline-flex items-center gap-1 text-white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Carrinho
      {count > 0 && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-magenta text-xs font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
