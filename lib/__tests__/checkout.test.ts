// lib/__tests__/checkout.test.ts
// Sem deliveryMethod válido não há fallback legado: rejeita com
// CheckoutError (vira 400 na rota) em vez de criar pedido "envio" sem endereço.
import { CheckoutError, createMercadoPagoCheckout } from "../checkout";

describe("createMercadoPagoCheckout deliveryMethod", () => {
  it("rejects missing deliveryMethod with a CheckoutError (400-class)", async () => {
    const err = await createMercadoPagoCheckout({
      name: "Ana",
      contact: "5511999999999",
      items: [{ slug: "xicara", qty: 1 }],
      baseUrl: "http://localhost:3000",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(CheckoutError);
    expect((err as Error).message).toBe("Informe a forma de entrega.");
  });

  it("rejects invalid deliveryMethod", async () => {
    const err = await createMercadoPagoCheckout({
      name: "Ana",
      contact: "5511999999999",
      deliveryMethod: "drone",
      items: [{ slug: "xicara", qty: 1 }],
      baseUrl: "http://localhost:3000",
    }).catch((e) => e);
    expect(err).toBeInstanceOf(CheckoutError);
    expect((err as Error).message).toBe("Informe a forma de entrega.");
  });
});
