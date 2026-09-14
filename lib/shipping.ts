// lib/shipping.ts
export const DEFAULT_BOX = { weight: 2.0, width: 30, height: 20, length: 20 };
export type DeliveryMethod = "envio" | "retirada";
export type AddressInput = { email: string; cep: string; rua: string; numero: string; compl: string; ref: string; bairro: string; cidade: string; uf: string };
export type ShippingOption = { id: string; name: string; price: number; eta: number };

export function normalizeCep(v: unknown): string {
  if (typeof v !== "string") return "";
  const d = v.replace(/\D/g, "");
  return d.length === 8 ? d : "";
}

export function validateAddress(method: DeliveryMethod, a: unknown): { ok: true; address: AddressInput } | { ok: false; error: string } {
  if (method === "retirada") return { ok: true, address: { email: "", cep: "", rua: "", numero: "", compl: "", ref: "", bairro: "", cidade: "", uf: "" } };
  const o = (a ?? {}) as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Informe um e-mail válido." };
  const cep = normalizeCep(o.cep);
  if (!cep) return { ok: false, error: "Informe um CEP válido com 8 dígitos." };
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");
  if (!str("rua")) return { ok: false, error: "Informe a rua." };
  if (!str("numero")) return { ok: false, error: "Informe o número." };
  if (!str("bairro")) return { ok: false, error: "Informe o bairro." };
  if (!str("cidade")) return { ok: false, error: "Informe a cidade." };
  const uf = str("uf").toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return { ok: false, error: "Informe a UF com 2 letras." };
  return { ok: true, address: { email, cep, rua: str("rua"), numero: str("numero"), compl: str("compl"), ref: str("ref"), bairro: str("bairro"), cidade: str("cidade"), uf } };
}

export function meApiBase(env: string | undefined): string {
  return env === "sandbox" ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
}

export function buildMeQuotePayload(args: { fromCep: string; toCep: string; products: { weight: number; width: number; height: number; length: number; insurance_value: number; quantity: number }[] }): object {
  return { from: { postal_code: args.fromCep }, to: { postal_code: args.toCep }, products: args.products };
}

export function parseMeQuoteResponse(json: unknown): ShippingOption[] {
  if (!Array.isArray(json)) return [];
  const out: ShippingOption[] = [];
  for (const r of json as any[]) {
    const price = Number(r.custom_price ?? r.price);
    const eta = Number(r.custom_delivery_time ?? r.delivery_time ?? 0);
    if (!r.id || !Number.isFinite(price)) continue;
    out.push({ id: String(r.id), name: String(r.name ?? r.company?.name ?? "Frete"), price: Math.round(price * 100) / 100, eta: Number.isFinite(eta) ? eta : 0 });
  }
  return out.sort((a, b) => a.price - b.price);
}
