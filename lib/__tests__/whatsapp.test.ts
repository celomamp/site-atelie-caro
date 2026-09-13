import { buildWhatsAppOrderMessage, whatsappLink } from "../whatsapp";

describe("whatsapp", () => {
  it("builds formatted order message", () => {
    const items = [
      { slug: "xicara", name: "Xícara", unitPrice: 90, qty: 2 },
      { slug: "vaso", name: "Vaso", unitPrice: 95, qty: 1 },
    ];
    const msg = buildWhatsAppOrderMessage(items);
    expect(msg).toContain("• Xícara — 2x — R$ 180,00");
    expect(msg).toContain("• Vaso — 1x — R$ 95,00");
    expect(msg).toContain("Total: R$ 275,00");
  });

  it("includes delivery block and broken total for envio", () => {
    const items = [{ slug: "vaso", name: "Vaso", unitPrice: 95, qty: 1 }];
    const msg = buildWhatsAppOrderMessage(items, {
      deliveryMethod: "envio",
      address: {
        rua: "Rua das Flores",
        numero: "123",
        bairro: "Centro",
        cidade: "Campinas",
        uf: "SP",
        cep: "13010000",
      },
      shipping: { serviceName: "PAC", price: 19.9, eta: 5 },
    });
    expect(msg).toContain("Entrega: Envio");
    expect(msg).toContain("Rua das Flores, 123");
    expect(msg).toContain("Frete: PAC — R$ 19,90 (5 dias)");
    expect(msg).toContain("Subtotal produtos: R$ 95,00");
    expect(msg).toContain("Total: R$ 114,90");
  });

  it("includes retirada block with zero freight", () => {
    const items = [{ slug: "vaso", name: "Vaso", unitPrice: 95, qty: 1 }];
    const msg = buildWhatsAppOrderMessage(items, { deliveryMethod: "retirada" });
    expect(msg).toContain("Retirada");
    expect(msg).toContain("Total: R$ 95,00");
  });
  it("builds wa.me link with encoded message", () => {
    const link = whatsappLink("Olá!");
    expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(link).toContain(encodeURIComponent("Olá!"));
  });
});
