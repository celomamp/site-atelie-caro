// app/api/checkout/mercadopago/route.test.ts
// Contrato de status: erro derivado do frete → 502 (client oferece frete a
// combinar); demais erros de checkout → 400. Texto da mensagem preservado.
import { POST } from "./route";
import {
  CheckoutError,
  FreightCheckoutError,
  createMercadoPagoCheckout,
} from "@/lib/checkout";

jest.mock("@/lib/ratelimit", () => ({
  hit: jest.fn(async () => ({ ok: true, retryAfter: 0 })),
  clientIp: jest.fn(() => "127.0.0.1"),
}));

jest.mock("@/lib/checkout", () => {
  class CheckoutError extends Error {}
  class FreightCheckoutError extends CheckoutError {}
  return {
    CheckoutError,
    FreightCheckoutError,
    createMercadoPagoCheckout: jest.fn(),
    getBaseUrl: jest.fn(() => "http://localhost:3000"),
  };
});

const mockedCreate = createMercadoPagoCheckout as jest.Mock;

function req(body: unknown) {
  return new Request("http://localhost/api/checkout/mercadopago", {
    method: "POST",
    body: JSON.stringify(body),
  }) as any;
}

beforeEach(() => {
  mockedCreate.mockReset();
});

describe("POST /api/checkout/mercadopago status contract", () => {
  it("returns 502 for freight-derived errors, keeping message text", async () => {
    const message =
      "Não foi possível cotar o frete. Tente de novo ou conclua como frete a combinar.";
    mockedCreate.mockRejectedValue(new FreightCheckoutError(message));
    const res = await POST(req({ name: "Ana", items: [] }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data).toEqual({ ok: false, error: message });
  });

  it("returns 502 for invalid freight service", async () => {
    mockedCreate.mockRejectedValue(
      new FreightCheckoutError("Serviço de frete inválido. Cote novamente.")
    );
    const res = await POST(req({ name: "Ana", items: [] }));
    expect(res.status).toBe(502);
  });

  it("returns 400 for generic checkout errors", async () => {
    mockedCreate.mockRejectedValue(new CheckoutError("Informe seu nome."));
    const res = await POST(req({ name: "", items: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ ok: false, error: "Informe seu nome." });
  });

  it("returns 400 for missing deliveryMethod", async () => {
    mockedCreate.mockRejectedValue(
      new CheckoutError("Informe a forma de entrega.")
    );
    const res = await POST(req({ name: "Ana", items: [] }));
    expect(res.status).toBe(400);
  });
});
