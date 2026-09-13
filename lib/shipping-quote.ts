// lib/shipping-quote.ts
// Server-only: cotação do Melhor Envio compartilhada entre
// POST /api/shipping/quote (Task 4) e o checkout MP (Task 5).
// Reutiliza as funções puras da Task 1 (lib/shipping.ts).
import {
  buildMeQuotePayload,
  meApiBase,
  parseMeQuoteResponse,
  ShippingOption,
} from "@/lib/shipping";

export type MeProductInput = {
  weight: number;
  width: number;
  height: number;
  length: number;
  insurance_value: number;
  quantity: number;
};

// Monta o item no formato da API do Melhor Envio a partir de um produto do
// banco (que pode não ter as dimensões tipadas até o generate rodar).
export function toMeProduct(
  product: {
    price: number | string | { toString(): string };
    weight?: unknown;
    width?: unknown;
    height?: unknown;
    length?: unknown;
  },
  qty: number
): MeProductInput {
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    weight: num(product.weight, 2),
    width: num(product.width, 30),
    height: num(product.height, 20),
    length: num(product.length, 20),
    insurance_value: Math.round(Number(product.price) * 100) / 100,
    quantity: qty,
  };
}

// Erro com mensagem amigável (vira 400/502 nas rotas; no checkout vira
// CheckoutError ou fallback "frete a combinar").
export class ShippingQuoteError extends Error {}

// Cota o frete no Melhor Envio. Lança ShippingQuoteError se o token/CEP de
// origem não estiver configurado ou se a API falhar.
export async function getShippingOptions(
  toCep: string,
  products: MeProductInput[],
  opts?: { timeoutMs?: number }
): Promise<ShippingOption[]> {
  const fromCep = (process.env.MELHOR_ENVIO_ORIGEM_CEP ?? "").replace(/\D/g, "");
  const token = process.env.MELHOR_ENVIO_TOKEN ?? "";
  if (!fromCep || !token)
    throw new ShippingQuoteError(
      "Frete indisponível no momento. Conclua como frete a combinar."
    );

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 8000);
  try {
    const res = await fetch(
      `${meApiBase(process.env.MELHOR_ENVIO_AMBIENTE)}/api/v2/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Atelie Caro (contato@ateliecaro.com.br)",
        },
        body: JSON.stringify(
          buildMeQuotePayload({ fromCep, toCep, products })
        ),
        signal: ctrl.signal,
      }
    );
    if (!res.ok)
      throw new ShippingQuoteError(
        "Não foi possível cotar o frete. Tente de novo ou conclua como frete a combinar."
      );
    return parseMeQuoteResponse(await res.json());
  } finally {
    clearTimeout(t);
  }
}
