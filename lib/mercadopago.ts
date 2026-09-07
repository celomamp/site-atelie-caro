// lib/mercadopago.ts
// Funções puras da integração Checkout Pro (Mercado Pago).
// Sem I/O e sem SDK: a parte server-side (SDK + Prisma) fica em lib/checkout.ts.

// Payload da preferência — estruturalmente compatível com o corpo de
// Preference.create() do SDK (snake_case da API do Mercado Pago).
export type PreferencePayload = {
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
    picture_url?: string;
  }[];
  external_reference: string;
  back_urls: { success: string; pending: string; failure: string };
  auto_return: "approved";
};

// Status do Mercado Pago → status interno do pedido (Order.status)
export function orderStatusFromPaymentStatus(status: string): string {
  switch (status) {
    case "approved":
      return "pago";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "aguardando_pagamento";
    case "rejected":
      return "pagamento_reprovado";
    case "cancelled":
      return "pagamento_cancelado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    default:
      return "aguardando_pagamento";
  }
}

export function buildBackUrls(baseUrl: string) {
  const url = `${baseUrl.replace(/\/+$/, "")}/checkout/retorno`;
  return { success: url, pending: url, failure: url };
}

export type PreferenceItemInput = {
  id: string;
  title: string;
  unitPrice: number;
  quantity: number;
  pictureUrl?: string;
};

export function buildPreferencePayload({
  orderId,
  items,
  baseUrl,
}: {
  orderId: string;
  items: PreferenceItemInput[];
  baseUrl: string;
}): PreferencePayload {
  return {
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      currency_id: "BRL",
      ...(i.pictureUrl ? { picture_url: i.pictureUrl } : {}),
    })),
    external_reference: orderId,
    back_urls: buildBackUrls(baseUrl),
    auto_return: "approved",
  };
}

export type CheckoutItemInput = { slug: string; qty: number };

export type CheckoutInputResult =
  | { ok: true; name: string; contact: string; items: CheckoutItemInput[] }
  | { ok: false; error: string };

// Valida e normaliza o input do checkout. Preço nunca vem daqui — o servidor
// busca sempre no banco por slug (lib/checkout.ts).
export function validateCheckoutInput(
  name: unknown,
  contact: unknown,
  items: unknown
): CheckoutInputResult {
  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { ok: false, error: "Informe seu nome." };
  const cleanContact = typeof contact === "string" ? contact.trim() : "";

  if (!Array.isArray(items) || items.length === 0)
    return { ok: false, error: "Seu carrinho está vazio." };

  const merged = new Map<string, number>();
  for (const raw of items) {
    const slug = (raw as { slug?: unknown } | null)?.slug;
    if (typeof slug !== "string" || !slug)
      return { ok: false, error: "Produto inválido no carrinho." };
    const qty = Number((raw as { qty?: unknown }).qty);
    if (!Number.isInteger(qty) || qty < 1)
      return { ok: false, error: "Quantidade inválida." };
    merged.set(slug, (merged.get(slug) ?? 0) + qty);
  }

  return {
    ok: true,
    name: cleanName,
    contact: cleanContact,
    items: [...merged.entries()].map(([slug, qty]) => ({ slug, qty })),
  };
}

// Extrai o id do pagamento de uma notificação. Webhooks do MP chegam como
// query string (?type=payment&data.id=...) ou corpo JSON ({ action, type, data }).
// IPN legado usa ?topic=payment&id=... Notificações de outros recursos são
// ignoradas (retornam null) — devem apenas ser confirmadas com 200.
export function parseWebhookNotification({
  searchParams,
  body,
}: {
  searchParams: URLSearchParams;
  body: unknown;
}): { paymentId: string } | null {
  const queryType = searchParams.get("type") ?? "";
  const queryTopic = searchParams.get("topic") ?? "";
  const isPaymentQuery = queryType === "payment" || queryTopic === "payment";
  if (isPaymentQuery) {
    const dataId = searchParams.get("data.id");
    if (dataId) return { paymentId: dataId };
    const legacyId = searchParams.get("id");
    if (legacyId) return { paymentId: legacyId };
  }

  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    const bodyType = typeof b.type === "string" ? b.type : "";
    const action = typeof b.action === "string" ? b.action : "";
    const isPayment = bodyType === "payment" || action.startsWith("payment.");
    const data = b.data as { id?: unknown } | undefined;
    if (isPayment && data && data.id !== undefined && data.id !== null) {
      return { paymentId: String(data.id) };
    }
  }

  return null;
}

// Base URL pública para back_urls e notification_url: usa NEXT_PUBLIC_APP_URL
// quando configurada, senão deriva dos headers de proxy (Vercel etc.).
export function resolveBaseUrl(
  envUrl: string | undefined,
  getHeader: (name: string) => string | null
): string {
  const fromEnv = typeof envUrl === "string" ? envUrl.trim() : "";
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const proto = getHeader("x-forwarded-proto") ?? "http";
  const host = getHeader("x-forwarded-host") ?? getHeader("host");
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
