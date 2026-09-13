import { SITE } from "./config";
import { CartItem, formatBRL } from "./cart";
import type { AddressInput, DeliveryMethod } from "./shipping";

export type WhatsAppDeliveryOpts = {
  deliveryMethod?: DeliveryMethod;
  address?: Partial<AddressInput>;
  shipping?: { serviceName?: string | null; price?: number | null; eta?: number | null } | null;
};

export function buildWhatsAppOrderMessage(items: CartItem[], opts?: WhatsAppDeliveryOpts): string {
  const lines = items.map(
    (i) => `• ${i.name} — ${i.qty}x — ${formatBRL(i.unitPrice * i.qty)}`
  );
  const productsTotal = items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  const method = opts?.deliveryMethod;
  const shippingPrice =
    method === "retirada"
      ? 0
      : typeof opts?.shipping?.price === "number"
        ? opts.shipping.price
        : null;
  const total =
    Math.round((productsTotal + (shippingPrice ?? 0)) * 100) / 100;

  const out: string[] = [
    "Olá, Ateliê Carô! Gostaria de fazer um pedido:",
    "",
    ...lines,
    "",
  ];

  if (method === "retirada") {
    out.push("Entrega: Retirada em Campinas", "");
  } else if (method === "envio") {
    out.push("Entrega: Envio pelos Correios/Melhor Envio");
    const a = opts?.address;
    if (a && (a.rua || a.cidade)) {
      const street = [a.rua, a.numero].filter(Boolean).join(", ");
      const city = [a.cidade, a.uf].filter(Boolean).join("/");
      const parts = [
        street,
        a.compl ? `Compl: ${a.compl}` : "",
        a.bairro,
        city,
        a.cep ? `CEP ${a.cep}` : "",
      ].filter(Boolean);
      if (parts.length > 0) out.push(`Endereço: ${parts.join(" - ")}`);
    }
    const s = opts?.shipping;
    if (s?.serviceName && typeof s.price === "number") {
      out.push(
        `Frete: ${s.serviceName} — ${formatBRL(s.price)}${typeof s.eta === "number" && s.eta > 0 ? ` (${s.eta} dias)` : ""}`
      );
    } else {
      out.push("Frete: a combinar");
    }
    out.push("");
  }

  if (method === "envio" || method === "retirada") {
    out.push(
      `Subtotal produtos: ${formatBRL(productsTotal)}`,
      `Frete: ${shippingPrice === null ? "a combinar" : formatBRL(shippingPrice)}`,
      `Total: ${formatBRL(total)}`
    );
  } else {
    out.push(`Total: ${formatBRL(total)}`);
  }
  return out.join("\n");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
