"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initial?: any; workshopId?: string };

export default function WorkshopForm({ initial, workshopId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    date: initial ? new Date(initial.date).toISOString().slice(0, 16) : "",
    duration: initial ? String(initial.duration) : "180",
    price: initial ? String(initial.price) : "",
    location: initial?.location || "",
    maxAttendees: initial ? String(initial.maxAttendees) : "8",
    spotsTaken: initial ? String(initial.spotsTaken) : "0",
    image: initial?.image || "",
    active: initial?.active ?? true,
  });

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = workshopId ? `/api/admin/oficinas/${workshopId}` : "/api/admin/oficinas";
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
      }),
    });
    if (res.ok) router.push("/admin/oficinas");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <input className="rounded border px-3 py-2" placeholder="Título" value={form.title}
        onChange={(e) => set("title", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Slug" value={form.slug}
        onChange={(e) => set("slug", e.target.value)} required />
      <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Descrição"
        value={form.description} onChange={(e) => set("description", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="datetime-local" value={form.date}
        onChange={(e) => set("date", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" placeholder="Duração (min)" value={form.duration}
        onChange={(e) => set("duration", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" step="0.01" placeholder="Preço" value={form.price}
        onChange={(e) => set("price", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Local" value={form.location}
        onChange={(e) => set("location", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" placeholder="Vagas máximas" value={form.maxAttendees}
        onChange={(e) => set("maxAttendees", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" placeholder="Vagas ocupadas" value={form.spotsTaken}
        onChange={(e) => set("spotsTaken", e.target.value)} />
      <input className="rounded border px-3 py-2 md:col-span-2" placeholder="URL da imagem" value={form.image}
        onChange={(e) => set("image", e.target.value)} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active}
        onChange={(e) => set("active", e.target.checked)} /> Ativa</label>
      <div className="md:col-span-2">
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar oficina</button>
      </div>
    </form>
  );
}
