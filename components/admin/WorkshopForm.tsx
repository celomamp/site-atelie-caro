"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initial?: any; workshopId?: string };

function toLocalDatetime(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WorkshopForm({ initial, workshopId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    date: initial ? toLocalDatetime(initial.date) : "",
    duration: initial ? String(initial.duration) : "180",
    price: initial ? String(initial.price) : "",
    location: initial?.location || "",
    maxAttendees: initial ? String(initial.maxAttendees) : "8",
    spotsTaken: initial ? String(initial.spotsTaken) : "0",
    image: initial?.image || "",
    active: initial?.active ?? true,
  });
  const [error, setError] = useState("");

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = workshopId ? `/api/admin/oficinas/${workshopId}` : "/api/admin/oficinas";
    try {
      const res = await fetch(url, {
        method: workshopId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          duration: parseInt(form.duration),
          price: parseFloat(form.price),
          maxAttendees: parseInt(form.maxAttendees),
          spotsTaken: parseInt(form.spotsTaken),
          image: form.image || null,
        }),
      });
      if (!res.ok) {
        setError("Não foi possível salvar a oficina. Verifique os dados e tente novamente.");
        return;
      }
      router.push("/admin/oficinas");
    } catch {
      setError("Erro de conexão. Não foi possível salvar a oficina.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-titulo" className="text-sm font-medium">Título</label>
        <input id="oficina-titulo" className="rounded border px-3 py-2" placeholder="Título" value={form.title}
          onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-slug" className="text-sm font-medium">Slug</label>
        <input id="oficina-slug" className="rounded border px-3 py-2" placeholder="Slug" value={form.slug}
          onChange={(e) => set("slug", e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="oficina-descricao" className="text-sm font-medium">Descrição</label>
        <textarea id="oficina-descricao" className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Descrição"
          value={form.description} onChange={(e) => set("description", e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-data" className="text-sm font-medium">Data e hora</label>
        <input id="oficina-data" className="rounded border px-3 py-2" type="datetime-local" value={form.date}
          onChange={(e) => set("date", e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-duracao" className="text-sm font-medium">Duração (min)</label>
        <input id="oficina-duracao" className="rounded border px-3 py-2" type="number" placeholder="Duração (min)" value={form.duration}
          onChange={(e) => set("duration", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-preco" className="text-sm font-medium">Preço (R$)</label>
        <input id="oficina-preco" className="rounded border px-3 py-2" type="number" step="0.01" placeholder="Preço" value={form.price}
          onChange={(e) => set("price", e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-local" className="text-sm font-medium">Local</label>
        <input id="oficina-local" className="rounded border px-3 py-2" placeholder="Local" value={form.location}
          onChange={(e) => set("location", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-max" className="text-sm font-medium">Vagas máximas</label>
        <input id="oficina-max" className="rounded border px-3 py-2" type="number" placeholder="Vagas máximas" value={form.maxAttendees}
          onChange={(e) => set("maxAttendees", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="oficina-ocupadas" className="text-sm font-medium">Vagas ocupadas</label>
        <input id="oficina-ocupadas" className="rounded border px-3 py-2" type="number" placeholder="Vagas ocupadas" value={form.spotsTaken}
          onChange={(e) => set("spotsTaken", e.target.value)} />
      </div>
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="oficina-imagem" className="text-sm font-medium">URL da imagem</label>
        <input id="oficina-imagem" className="rounded border px-3 py-2 md:col-span-2" placeholder="URL da imagem" value={form.image}
          onChange={(e) => set("image", e.target.value)} />
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active}
        onChange={(e) => set("active", e.target.checked)} /> Ativa</label>
      <div className="md:col-span-2">
        {error && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar oficina</button>
      </div>
    </form>
  );
}
