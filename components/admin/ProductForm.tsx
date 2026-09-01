// components/admin/ProductForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial?: any;
  productId?: string;
};

function parseImages(raw?: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ProductForm({ initial, productId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    price: initial ? String(initial.price) : "",
    category: initial?.category || "utensilios",
    stock: initial ? String(initial.stock) : "1",
    featured: initial?.featured || false,
    available: initial?.available ?? true,
  });
  const [images, setImages] = useState<string[]>(() => parseImages(initial?.images));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        setError("Não foi possível enviar a imagem. Verifique o formato e o tamanho.");
        return;
      }
      const data = await res.json();
      if (data.ok) setImages((prev) => [...prev, data.url]);
      else setError("Não foi possível enviar a imagem.");
    } catch {
      setError("Erro de conexão ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = productId ? `/api/admin/produtos/${productId}` : "/api/admin/produtos";
    try {
      const res = await fetch(url, {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock), images }),
      });
      if (!res.ok) {
        setError("Não foi possível salvar o produto. Verifique se o slug já existe ou os dados e tente novamente.");
        return;
      }
      router.push("/admin/produtos");
    } catch {
      setError("Erro de conexão. Não foi possível salvar o produto.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <input className="rounded border px-3 py-2" placeholder="Nome" value={form.name}
        onChange={(e) => set("name", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Slug (ex: xicara-azul)" value={form.slug}
        onChange={(e) => set("slug", e.target.value)} required />
      <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Descrição"
        value={form.description} onChange={(e) => set("description", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" step="0.01" placeholder="Preço" value={form.price}
        onChange={(e) => set("price", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" placeholder="Estoque" value={form.stock}
        onChange={(e) => set("stock", e.target.value)} />
      <select className="rounded border px-3 py-2" value={form.category}
        onChange={(e) => set("category", e.target.value)}>
        <option value="utensilios">Utensílios</option>
        <option value="decoracao">Decoração</option>
        <option value="vasos">Vasos</option>
      </select>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)} /> Destaque</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.available}
          onChange={(e) => set("available", e.target.checked)} /> Disponível</label>
      </div>
      <div className="md:col-span-2">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">Enviando...</p>}
        {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {images.length > 0 && (
          <div className="mt-2 flex gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} className="h-16 w-16 rounded object-cover" alt="" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-clay px-1 text-white">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar produto</button>
      </div>
    </form>
  );
}
