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

  it("builds wa.me link with encoded message", () => {
    const link = whatsappLink("Olá!");
    expect(link).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
    expect(link).toContain(encodeURIComponent("Olá!"));
  });
});
