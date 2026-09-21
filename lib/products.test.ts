// lib/products.test.ts
import { productOrderBy } from "./products";

describe("productOrderBy", () => {
  it("padrão ordena pelos mais recentes", () => {
    expect(productOrderBy()).toEqual({ createdAt: "desc" });
    expect(productOrderBy("")).toEqual({ createdAt: "desc" });
    expect(productOrderBy("desconhecido")).toEqual({ createdAt: "desc" });
  });

  it("ordena por preço", () => {
    expect(productOrderBy("menor")).toEqual({ price: "asc" });
    expect(productOrderBy("maior")).toEqual({ price: "desc" });
  });

  it("ordena alfabeticamente", () => {
    expect(productOrderBy("az")).toEqual({ name: "asc" });
    expect(productOrderBy("za")).toEqual({ name: "desc" });
  });
});
