export type EncomendaReference = {
  slug: string;
  name: string;
};

export function encomendaLink(slug?: string): string {
  if (!slug) return "/encomendas";
  return `/encomendas?ref=${encodeURIComponent(slug)}`;
}

export function resolveReference<T extends { slug: string }>(
  products: T[],
  refParam: string | null | undefined
): T | undefined {
  if (!refParam) return undefined;
  return products.find((p) => p.slug === refParam);
}

export const MAX_ENCOMENDA_IMAGES = 3;

export type EncomendaPayload = {
  name: string;
  contact: string;
  description: string;
  images: string[];
  referenceSlug: string | null;
  referenceName: string | null;
};

function isOwnStorageUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return true;
  if (
    (url.startsWith("https://") || url.startsWith("http://")) &&
    url.includes("/storage/v1/object/public/")
  ) {
    return true;
  }
  return false;
}

export function parseEncomendaPayload(
  body: unknown
): { ok: true; data: EncomendaPayload } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = text(b.name);
  const contact = text(b.contact);
  const description = text(b.description);
  if (!name) return { ok: false, error: "Informe seu nome." };
  if (!contact) return { ok: false, error: "Informe um contato." };
  if (!description) return { ok: false, error: "Descreva a peça." };
  const rawImages = Array.isArray(b.images) ? b.images : [];
  if (rawImages.length > MAX_ENCOMENDA_IMAGES) {
    return { ok: false, error: `Envie no máximo ${MAX_ENCOMENDA_IMAGES} imagens.` };
  }
  const images: string[] = [];
  for (const img of rawImages) {
    if (typeof img !== "string" || !isOwnStorageUrl(img)) {
      return { ok: false, error: "Imagem inválida." };
    }
    images.push(img);
  }
  const refText = (v: unknown) => {
    const t = text(v);
    return t ? t : null;
  };
  return {
    ok: true,
    data: {
      name,
      contact,
      description,
      images,
      referenceSlug: refText(b.referenceSlug ?? b.ref),
      referenceName: refText(b.referenceName),
    },
  };
}
function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterReferenceProducts<T extends { name: string }>(
  products: T[],
  query: string
): T[] {
  const q = normalizeSearch(query.trim());
  if (!q) return products;
  return products.filter((p) => normalizeSearch(p.name).includes(q));
}
