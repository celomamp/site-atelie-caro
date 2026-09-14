import { MAX_ENCOMENDA_IMAGES, parseEncomendaPayload } from "../encomendas";

describe("parseEncomendaPayload", () => {
  const base = {
    name: "Maria",
    contact: "19999999999",
    description: "Quero um vaso azul",
  };

  it("accepts a valid payload without images", () => {
    const res = parseEncomendaPayload(base);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.name).toBe("Maria");
      expect(res.data.images).toEqual([]);
    }
  });

  it("rejects missing required fields", () => {
    expect(parseEncomendaPayload({ ...base, name: "  " }).ok).toBe(false);
    expect(parseEncomendaPayload({ ...base, contact: "" }).ok).toBe(false);
    expect(parseEncomendaPayload({ ...base, description: "" }).ok).toBe(false);
  });

  it("accepts up to 3 own-storage image urls", () => {
    expect(MAX_ENCOMENDA_IMAGES).toBe(3);
    const res = parseEncomendaPayload({
      ...base,
      images: ["/uploads/media/a.jpg", "/uploads/media/b.png"],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.images).toHaveLength(2);
  });

  it("rejects more than 3 images", () => {
    const res = parseEncomendaPayload({
      ...base,
      images: ["/uploads/media/1.jpg", "/uploads/media/2.jpg", "/uploads/media/3.jpg", "/uploads/media/4.jpg"],
    });
    expect(res.ok).toBe(false);
  });

  it("rejects external image urls", () => {
    const res = parseEncomendaPayload({
      ...base,
      images: ["https://evil.example/pic.jpg"],
    });
    expect(res.ok).toBe(false);
  });

  it("trims reference fields", () => {
    const res = parseEncomendaPayload({
      ...base,
      referenceSlug: "  vaso-azul ",
      referenceName: " Vaso Azul ",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.referenceSlug).toBe("vaso-azul");
      expect(res.data.referenceName).toBe("Vaso Azul");
    }
  });
});
