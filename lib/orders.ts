import { CartItem } from "./cart";

export function buildOrderRecord(name: string, contact: string, items: CartItem[]) {
  const total = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  return {
    name,
    contact,
    items: items.map((i) => ({
      slug: i.slug,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
    })),
    total,
  };
}
