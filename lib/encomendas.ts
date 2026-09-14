export type EncomendaReference = {
  slug: string;
  name: string;
};

export function buildEncomendaMessage(input: {
  name: string;
  contact: string;
  description: string;
  reference?: EncomendaReference | null;
}): string {
  const lines = [
    "Olá, Ateliê Carô! Gostaria de solicitar um orçamento de encomenda:",
    "",
    `Nome: ${input.name}`,
    `Contato: ${input.contact}`,
    "",
  ];
  if (input.reference) {
    lines.push(
      `Referência: ${input.reference.name} (/produtos/${input.reference.slug})`,
      ""
    );
  }
  lines.push("Descrição da peça:", input.description);
  return lines.join("\n");
}

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
