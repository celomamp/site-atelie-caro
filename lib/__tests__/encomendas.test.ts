import {
  encomendaLink,
  filterReferenceProducts,
  resolveReference,
} from "../encomendas";

describe("encomendas referencia", () => {
  it("builds encomenda link with and without ref", () => {
    expect(encomendaLink()).toBe("/encomendas");
    expect(encomendaLink("vaso-azul")).toBe("/encomendas?ref=vaso-azul");
  });

  it("resolves reference slug to product", () => {
    const products = [
      { slug: "vaso-azul", name: "Vaso Azul" },
      { slug: "xicara", name: "Xícara" },
    ];
    expect(resolveReference(products, "vaso-azul")).toEqual({
      slug: "vaso-azul",
      name: "Vaso Azul",
    });
    expect(resolveReference(products, null)).toBeUndefined();
    expect(resolveReference(products, "inexistente")).toBeUndefined();
  });

  it("filters reference products by name ignoring case and accents", () => {
    const products = [
      { slug: "vaso-azul", name: "Vaso Azul" },
      { slug: "xicara-flor", name: "Xícara Flor" },
      { slug: "prato", name: "Prato" },
    ];
    expect(filterReferenceProducts(products, "")).toHaveLength(3);
    expect(filterReferenceProducts(products, "vaso")).toEqual([
      { slug: "vaso-azul", name: "Vaso Azul" },
    ]);
    expect(filterReferenceProducts(products, "XICARA")).toEqual([
      { slug: "xicara-flor", name: "Xícara Flor" },
    ]);
    expect(filterReferenceProducts(products, "inexistente")).toEqual([]);
  });
});
