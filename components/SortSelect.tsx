// components/SortSelect.tsx
"use client";

export default function SortSelect({ categoria, ordenar }: { categoria?: string; ordenar?: string }) {
  return (
    <select
      className="rounded border border-gray-300 px-3 py-1 text-sm"
      value={ordenar || ""}
      onChange={(e) => {
        const v = e.target.value;
        window.location.href = `/produtos?${categoria ? `categoria=${categoria}&` : ""}ordenar=${v}`;
      }}
    >
      <option value="">Ordenar</option>
      <option value="menor">Menor preço</option>
      <option value="maior">Maior preço</option>
    </select>
  );
}
