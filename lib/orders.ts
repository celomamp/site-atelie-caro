import { CartItem } from "./cart";

export type OrderItem = {
  slug: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export function parseOrderItems(raw: string | null | undefined): OrderItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OrderItem[];
  } catch {
    return [];
  }
}

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
