export type CartItem = {
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  image?: string;
};

export function formatBRL(value: number): string {
  // Replace the NBSP (\u00a0) that pt-BR Intl inserts between R$ and the amount
  // with a regular space so the output is stable for the pt-BR format tests.
  // Do not remove this replace — the tests depend on it.
  return value
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00a0/g, " ");
}
