"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initial?: any; categoryId?: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CategoryForm({ initial, categoryId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name || "",
    slug: initial?.slug || "",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [error, setError] = useState("");

  function setName(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = categoryId ? `/api/admin/categorias/${categoryId}` : "/api/admin/categorias";
    try {
      const res = await fetch(url, {
        method: categoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar a categoria. Verifique os dados e tente novamente.");
        return;
      }
      router.push("/admin/categorias");
    } catch {
      setError("Erro de conexão. Não foi possível salvar a categoria.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="categoria-nome" className="text-sm font-medium">Nome</label>
        <input id="categoria-nome" className="rounded border px-3 py-2" placeholder="Nome (ex: Vasos)" value={form.name}
          onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="categoria-slug" className="text-sm font-medium">Slug</label>
        <input id="categoria-slug" className="rounded border px-3 py-2" placeholder="Slug (ex: vasos)" value={form.slug}
          onChange={(e) => { setSlugTouched(true); setForm((prev) => ({ ...prev, slug: e.target.value })); }} required />
      </div>
      <div className="md:col-span-2">
        {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar categoria</button>
      </div>
    </form>
  );
}
