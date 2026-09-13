// lib/__tests__/shipping.test.ts
import { normalizeCep, validateAddress, parseMeQuoteResponse, buildMeQuotePayload, meApiBase, DEFAULT_BOX } from "../shipping";

describe("shipping domain", () => {
  it("normalizes cep", () => {
    expect(normalizeCep("13083-000")).toBe("13083000");
    expect(normalizeCep("abc")).toBe("");
  });
  it("defaults box", () => {
    expect(DEFAULT_BOX).toEqual({ weight: 2.0, width: 30, height: 20, length: 20 });
  });
  it("rejects envio without cep", () => {
    const r = validateAddress("envio", { email: "a@b.com", cep: "", rua: "R", numero: "1", bairro: "B", cidade: "C", uf: "SP", compl: "" });
    expect(r.ok).toBe(false);
  });
  it("accepts retirada without address", () => {
    const r = validateAddress("retirada", {});
    expect(r.ok).toBe(true);
  });
  it("rejects invalid email on envio", () => {
    const r = validateAddress("envio", { email: "x", cep: "13083000", rua: "R", numero: "1", bairro: "B", cidade: "C", uf: "SP", compl: "" });
    expect(r.ok).toBe(false);
  });
  it("builds ME payload por produtos", () => {
    const p = buildMeQuotePayload({ fromCep: "13083000", toCep: "01001000", products: [{ weight: 2, width: 30, height: 20, length: 20, insurance_value: 90, quantity: 1 }] }) as any;
    expect(p.from.postal_code).toBe("13083000");
    expect(p.to.postal_code).toBe("01001000");
    expect(p.products[0].quantity).toBe(1);
  });
  it("parses ME response using custom_price", () => {
    const out = parseMeQuoteResponse([{ id: 1, name: "PAC", custom_price: "25.35", custom_delivery_time: 5, price: "30", delivery_time: 6 }]);
    expect(out).toEqual([{ id: "1", name: "PAC", price: 25.35, eta: 5 }]);
  });
  it("falls back to price when custom missing", () => {
    const out = parseMeQuoteResponse([{ id: 2, name: "SEDEX", price: "40.1", delivery_time: 2 }]);
    expect(out).toEqual([{ id: "2", name: "SEDEX", price: 40.1, eta: 2 }]);
  });
  it("selects sandbox vs production base", () => {
    expect(meApiBase("sandbox")).toContain("sandbox.melhorenvio.com.br");
    expect(meApiBase("production")).toContain("melhorenvio.com.br");
  });
});
