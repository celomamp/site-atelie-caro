export type CartItem = {
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  image?: string;
};

export function formatBRL(value: number): string {
  return value
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00a0/g, " ");
}
