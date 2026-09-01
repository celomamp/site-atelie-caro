import { buildOrderRecord } from "@/lib/orders";

describe("buildOrderRecord", () => {
  it("computes total from items", () => {
    const rec = buildOrderRecord("Ana", "5511", [
      { slug: "xicara", name: "Xícara", unitPrice: 90, qty: 2 },
    ]);
    expect(rec.items).toHaveLength(1);
    expect(Number(rec.total)).toBe(180);
  });
});
