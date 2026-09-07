import { buildOrderRecord, parseOrderItems } from "@/lib/orders";

describe("buildOrderRecord", () => {
  it("computes total from items", () => {
    const rec = buildOrderRecord("Ana", "5511", [
      { slug: "xicara", name: "Xícara", unitPrice: 90, qty: 2 },
    ]);
    expect(rec.items).toHaveLength(1);
    expect(Number(rec.total)).toBe(180);
  });
});

describe("parseOrderItems", () => {
  it("parses a valid items JSON", () => {
    const items = parseOrderItems(
      JSON.stringify([{ slug: "xicara", name: "Xícara", qty: 2, unitPrice: 90 }])
    );
    expect(items).toEqual([{ slug: "xicara", name: "Xícara", qty: 2, unitPrice: 90 }]);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseOrderItems("not json")).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    expect(parseOrderItems('{"a":1}')).toEqual([]);
  });

  it("returns empty array for null or undefined", () => {
    expect(parseOrderItems(null)).toEqual([]);
    expect(parseOrderItems(undefined)).toEqual([]);
  });
});
