// components/AddToCartButton.tsx
"use client";
import { useState } from "react";
import { useCart } from "./CartContext";

type Props = {
  slug: string;
  name: string;
  price: number;
  image?: string;
};

export default function AddToCartButton({ slug, name, price, image }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded border border-gray-300">
        <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
        <span className="w-8 text-center">{qty}</span>
        <button className="px-3 py-2" onClick={() => setQty(qty + 1)}>+</button>
      </div>
      <button
        className="rounded bg-cobalt px-6 py-3 font-semibold text-white hover:bg-blue-700"
        onClick={() => addItem({ slug, name, unitPrice: price, qty, image })}
      >
        Adicionar ao carrinho
      </button>
    </div>
  );
}
