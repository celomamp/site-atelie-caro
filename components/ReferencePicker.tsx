// components/ReferencePicker.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatBRL } from "@/lib/cart";
import { filterReferenceProducts } from "@/lib/encomendas";

export type ReferenceProduct = {
  slug: string;
  name: string;
  price: number;
  images: string[];
};

const MAX_RESULTS = 6;

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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => filterReferenceProducts(products, query).slice(0, MAX_RESULTS),
    [products, query]
  );
  const totalMatches = useMemo(
    () => filterReferenceProducts(products, query).length,
    [products, query]
  );

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function pick(slug: string) {
    onChange(slug);
    setQuery("");
    setOpen(false);
    setChanging(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setOpen(false);
    setChanging(false);
  }

  if (selected && !changing) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Peça de referência</span>
        <div className="flex items-center gap-4 rounded border border-gray-200 p-4">
          {selected.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.images[0]}
              alt={selected.name}
              className="h-24 w-24 rounded object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded bg-cream" aria-hidden />
          )}
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
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setChanging(true);
                setQuery("");
                setOpen(true);
              }}
              className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" ref={boxRef}>
      <label htmlFor="encomenda-ref-busca" className="text-sm font-semibold">
        Peça de referência (opcional)
      </label>
      <div className="relative">
        <input
          id="encomenda-ref-busca"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="encomenda-ref-lista"
          aria-label="Buscar peça de referência"
          className="w-full rounded border border-gray-300 px-3 py-2 pr-9"
          placeholder="Busque pelo nome da peça…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        )}
        {open && (
          <ul
            id="encomenda-ref-lista"
            role="listbox"
            aria-label="Peças encontradas"
            className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg"
          >
            <li role="option" aria-selected="false">
              <button
                type="button"
                onClick={clear}
                className="block w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
              >
                Sem referência — peça totalmente nova
              </button>
            </li>
            {results.map((p) => (
              <li key={p.slug} role="option" aria-selected={p.slug === value}>
                <button
                  type="button"
                  onClick={() => pick(p.slug)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-blush"
                >
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0]}
                      alt=""
                      aria-hidden
                      className="h-12 w-12 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded bg-cream" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-magenta">
                      {formatBRL(Number(p.price))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-3 text-sm text-gray-500">
                Nenhuma peça encontrada{query.trim() ? ` para “${query.trim()}”` : ""}.
              </li>
            )}
          </ul>
        )}
      </div>
      <p className="text-xs text-gray-500">
        {query.trim()
          ? `${totalMatches} peça(s) encontrada(s) — escolha uma como ponto de partida.`
          : `${products.length} peça(s) no catálogo — digite para filtrar e veja a foto antes de escolher.`}
      </p>
    </div>
  );
}
