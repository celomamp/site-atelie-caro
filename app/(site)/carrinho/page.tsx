"use client";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatBRL } from "@/lib/cart";
import CheckoutForm from "@/components/CheckoutForm";

export default function CarrinhoPage() {
  const { items, setQty, removeItem } = useCart();

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Seu carrinho está vazio</h1>
        <Link href="/produtos" className="mt-6 inline-block rounded bg-cobalt px-6 py-3 font-semibold text-white">
          Ver produtos
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Carrinho</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          {items.map((i) => (
            <div key={i.slug} className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow">
              <div>
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-magenta">{formatBRL(i.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded border border-gray-300">
                  <button className="px-2" onClick={() => setQty(i.slug, i.qty - 1)}>−</button>
                  <span className="w-6 text-center">{i.qty}</span>
                  <button className="px-2" onClick={() => setQty(i.slug, i.qty + 1)}>+</button>
                </div>
                <button onClick={() => removeItem(i.slug)} className="text-clay">Remover</button>
              </div>
            </div>
          ))}
        </div>
        <CheckoutForm />
      </div>
    </div>
  );
}
