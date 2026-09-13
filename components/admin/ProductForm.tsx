// components/admin/ProductForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseImages } from "@/lib/images";

type ProductCategory = { id: string; name: string };

type Props = {
  initial?: any;
  productId?: string;
  categories: ProductCategory[];
};

export default function ProductForm({ initial, productId, categories }: Props) {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial?.categories?.map((c: { id: string }) => c.id) ?? []
  );
  const [form, setForm] = useState({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    price: initial ? String(initial.price) : "",
    stock: initial ? String(initial.stock) : "1",
    weight: initial?.weight != null ? String(initial.weight) : "2",
    width: initial?.width != null ? String(initial.width) : "30",
    height: initial?.height != null ? String(initial.height) : "20",
    length: initial?.length != null ? String(initial.length) : "20",
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
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) {
          setError(`Não foi possível enviar ${file.name}. Verifique o formato e o tamanho.`);
          continue;
        }
        const data = await res.json();
        if (data.ok) setImages((prev) => [...prev, data.url]);
        else setError(`Não foi possível enviar ${file.name}.`);
      }
    } catch {
      setError("Erro de conexão ao enviar as imagens.");
    } finally {
      setUploading(false);
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = productId ? `/api/admin/produtos/${productId}` : "/api/admin/produtos";
    try {
      const res = await fetch(url, {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock), weight: parseFloat((form as any).weight) || 2, width: parseFloat((form as any).width) || 30, height: parseFloat((form as any).height) || 20, length: parseFloat((form as any).length) || 20, images, categories: selectedCategories }),
      });
      if (!res.ok) {
        setError("Não foi possível salvar o produto. Verifique se o slug já existe ou os dados e tente novamente.");
        return;
      }
      router.refresh();
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
      <input className="rounded border px-3 py-2" type="number" step="0.01" min="0.1" placeholder="Peso (kg)" value={(form as any).weight} onChange={(e) => set("weight", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Largura (cm)" value={(form as any).width} onChange={(e) => set("width", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Altura (cm)" value={(form as any).height} onChange={(e) => set("height", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Comprimento (cm)" value={(form as any).length} onChange={(e) => set("length", e.target.value)} />
      <div className="md:col-span-2">
        <p className="mb-1 font-semibold">Categorias</p>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedCategories.includes(c.id)}
                  onChange={() => toggleCategory(c.id)} /> {c.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma categoria cadastrada. <a href="/admin/categorias/nova" className="text-cobalt">Criar categoria</a></p>
        )}
        {selectedCategories.length === 0 && categories.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">Nenhuma categoria selecionada — o produto ficará sem categoria.</p>
        )}
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)} /> Destaque</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.available}
          onChange={(e) => set("available", e.target.checked)} /> Disponível</label>
      </div>
      <div className="md:col-span-2">
        <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} />
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
