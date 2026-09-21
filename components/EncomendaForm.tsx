// components/EncomendaForm.tsx
"use client";
import { useRef, useState } from "react";
import { resolveReference, MAX_ENCOMENDA_IMAGES } from "@/lib/encomendas";
import ReferencePicker, { type ReferenceProduct } from "@/components/ReferencePicker";

export const ENCOMENDA_DISCLAIMER =
  "Recebemos sua encomenda! Um artesão entrará em contato pelo contato informado com mais informações sobre custo e prazo.";

export default function EncomendaForm({
  products = [],
  initialRefSlug = null,
}: {
  products?: ReferenceProduct[];
  initialRefSlug?: string | null;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [desc, setDesc] = useState("");
  const [refSlug, setRefSlug] = useState<string | null>(initialRefSlug);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    if (images.length + picked.length > MAX_ENCOMENDA_IMAGES) {
      setError(`Envie no máximo ${MAX_ENCOMENDA_IMAGES} imagens.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of picked) fd.append("file", f);
      const res = await fetch("/api/encomendas/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(
          res.status === 413
            ? "Uma das imagens é grande demais (máximo 5 MB cada)."
            : "Não foi possível enviar as imagens. Use apenas arquivos de imagem (JPG, PNG, WEBP ou GIF)."
        );
        return;
      }
      setImages((prev) => [...prev, ...data.urls].slice(0, MAX_ENCOMENDA_IMAGES));
    } catch {
      setError("Não foi possível enviar as imagens. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !desc.trim()) {
      setError("Preencha nome, contato e descrição da peça.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const reference = resolveReference(products, refSlug);
      const res = await fetch("/api/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          description: desc.trim(),
          images,
          referenceSlug: reference?.slug ?? null,
          referenceName: reference?.name ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Não foi possível enviar sua encomenda. Tente novamente.");
        return;
      }
      setSent(true);
      setName("");
      setContact("");
      setDesc("");
      setRefSlug(null);
      setImages([]);
    } catch {
      setError("Não foi possível enviar sua encomenda. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="font-display text-2xl font-bold">Encomenda recebida!</h2>
        <p className="mt-2 leading-relaxed text-gray-700">{ENCOMENDA_DISCLAIMER}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 rounded border border-cobalt px-6 py-2 font-semibold text-cobalt hover:bg-blue-50"
        >
          Fazer outra encomenda
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg bg-white p-6 shadow"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-nome" className="text-sm font-semibold">Seu nome *</label>
          <input id="encomenda-nome" name="nome" autoComplete="name" required className="rounded border border-gray-300 px-3 py-2" placeholder="Seu nome" value={name}
            onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-contato" className="text-sm font-semibold">WhatsApp / contato *</label>
          <input id="encomenda-contato" name="contato" autoComplete="tel" required className="rounded border border-gray-300 px-3 py-2" placeholder="WhatsApp / contato" value={contact}
            onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-desc" className="text-sm font-semibold">Descrição da peça *</label>
          <textarea id="encomenda-desc" name="descricao" required className="rounded border border-gray-300 px-3 py-2" rows={5} placeholder="Descreva a peça que você quer (tipo, tamanho, cores...)"
            value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <ReferencePicker products={products} value={refSlug} onChange={setRefSlug} />
        <div className="flex flex-col gap-1">
          <label htmlFor="encomenda-imagens" className="text-sm font-semibold">
            Imagens de referência (opcional, até {MAX_ENCOMENDA_IMAGES})
          </label>
          <input
            ref={fileRef}
            id="encomenda-imagens"
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || submitting || images.length >= MAX_ENCOMENDA_IMAGES}
            onChange={(e) => handleFiles(e.target.files)}
            className="text-sm"
          />
          {uploading && <p className="text-sm text-gray-500">Enviando imagens...</p>}
          {images.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {images.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Referência da encomenda" className="h-20 w-20 rounded object-cover" />
                  <button
                    type="button"
                    aria-label="Remover imagem"
                    onClick={() => setImages(images.filter((u) => u !== url))}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}
        <button
          disabled={uploading || submitting}
          className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar encomenda"}
        </button>
      </div>
    </form>
  );
}
