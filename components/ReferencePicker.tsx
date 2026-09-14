// components/ReferencePicker.tsx
"use client";
import Link from "next/link";
import { formatBRL } from "@/lib/cart";

export type ReferenceProduct = {
  slug: string;
  name: string;
  price: number;
  images: string[];
};

export default function ReferencePicker({
  products,
  value,
  onChange,
}: {
  products: ReferenceProduct[];
  value: string | null;
  onChange: (slug: string | null) => void;
}) {
  const selected = products.find((p) => p.slug === value) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="encomenda-ref" className="text-sm font-semibold">
        Peça de referência (opcional)
      </label>
      <select
        id="encomenda-ref"
        className="rounded border border-gray-300 px-3 py-2"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Sem referência — peça totalmente nova</option>
        {products.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name} — {formatBRL(Number(p.price))}
          </option>
        ))}
      </select>
      {selected && (
        <div className="flex items-center gap-3 rounded border border-gray-200 p-3">
          {selected.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.images[0]}
              alt={selected.name}
              className="h-16 w-16 rounded object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{selected.name}</p>
            <p className="text-sm text-magenta">{formatBRL(Number(selected.price))}</p>
            <Link
              href={`/produtos/${selected.slug}`}
              target="_blank"
              className="text-xs text-cobalt underline"
            >
              Ver peça
            </Link>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
