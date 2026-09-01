import { SITE } from "./config";
import { CartItem, formatBRL } from "./cart";

export function buildWhatsAppOrderMessage(items: CartItem[]): string {
  const lines = items.map(
    (i) => `• ${i.name} — ${i.qty}x — ${formatBRL(i.unitPrice * i.qty)}`
  );
  const total = items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  return [
    "Olá, Ateliê Carô! Gostaria de fazer um pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatBRL(total)}`,
  ].join("\n");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
