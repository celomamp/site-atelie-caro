import {
  buildEncomendaMessage,
  encomendaLink,
  resolveReference,
} from "../encomendas";

describe("encomendas referencia", () => {
  it("builds message without reference", () => {
    const msg = buildEncomendaMessage({
      name: "Maria",
      contact: "19999999999",
      description: "Quero um vaso azul",
    });
    expect(msg).toContain("Olá, Ateliê Carô! Gostaria de solicitar um orçamento de encomenda:");
    expect(msg).toContain("Nome: Maria");
    expect(msg).toContain("Quero um vaso azul");
    expect(msg).not.toContain("Referência:");
  });

  it("builds message with reference", () => {
    const msg = buildEncomendaMessage({
      name: "Maria",
      contact: "19999999999",
      description: "Quero igual mas verde",
      reference: { slug: "vaso-azul", name: "Vaso Azul" },
    });
    expect(msg).toContain("Referência: Vaso Azul (/produtos/vaso-azul)");
    expect(msg).toContain("Quero igual mas verde");
  });

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
});
