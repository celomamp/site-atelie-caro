// components/SortSelect.tsx
"use client";

export default function SortSelect({ categoria, ordenar, favoritos }: { categoria?: string; ordenar?: string; favoritos?: string }) {
  return (
    <select
      className="rounded border border-gray-300 px-3 py-1 text-sm"
      value={ordenar || ""}
      onChange={(e) => {
        const v = e.target.value;
        const params = new URLSearchParams();
        if (categoria) params.set("categoria", categoria);
        if (v) params.set("ordenar", v);
        if (favoritos === "1") params.set("favoritos", "1");
        window.location.href = `/produtos?${params.toString()}`;
      }}
    >
      <option value="">Ordenar</option>
      <option value="menor">Menor preço</option>
      <option value="maior">Maior preço</option>
    </select>
  );
}
