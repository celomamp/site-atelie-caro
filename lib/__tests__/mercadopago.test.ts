import {
  orderStatusFromPaymentStatus,
  buildBackUrls,
  buildPreferencePayload,
  validateCheckoutInput,
  parseWebhookNotification,
  resolveBaseUrl,
} from "../mercadopago";

describe("orderStatusFromPaymentStatus", () => {
  it("maps approved to pago", () => {
    expect(orderStatusFromPaymentStatus("approved")).toBe("pago");
  });

  it("maps pending, in_process and in_mediation to aguardando_pagamento", () => {
    expect(orderStatusFromPaymentStatus("pending")).toBe("aguardando_pagamento");
    expect(orderStatusFromPaymentStatus("in_process")).toBe("aguardando_pagamento");
    expect(orderStatusFromPaymentStatus("in_mediation")).toBe("aguardando_pagamento");
  });

  it("maps rejected to pagamento_reprovado", () => {
    expect(orderStatusFromPaymentStatus("rejected")).toBe("pagamento_reprovado");
  });

  it("maps cancelled to pagamento_cancelado", () => {
    expect(orderStatusFromPaymentStatus("cancelled")).toBe("pagamento_cancelado");
  });

  it("maps refunded and charged_back to reembolsado", () => {
    expect(orderStatusFromPaymentStatus("refunded")).toBe("reembolsado");
    expect(orderStatusFromPaymentStatus("charged_back")).toBe("reembolsado");
  });

  it("falls back to aguardando_pagamento for unknown statuses", () => {
    expect(orderStatusFromPaymentStatus("whatever")).toBe("aguardando_pagamento");
  });
});

describe("buildBackUrls", () => {
  it("returns success, pending and failure pointing to /checkout/retorno", () => {
    expect(buildBackUrls("https://atelie.com")).toEqual({
      success: "https://atelie.com/checkout/retorno",
      pending: "https://atelie.com/checkout/retorno",
      failure: "https://atelie.com/checkout/retorno",
    });
  });

  it("strips trailing slash from base url", () => {
    expect(buildBackUrls("https://atelie.com/").success).toBe(
      "https://atelie.com/checkout/retorno"
    );
  });
});

describe("buildPreferencePayload", () => {
  const items = [
    { id: "xicara", title: "Xícara", unitPrice: 90, quantity: 2, pictureUrl: "https://img/x.jpg" },
    { id: "vaso", title: "Vaso", unitPrice: 95.5, quantity: 1 },
  ];

  it("maps items to Mercado Pago format with BRL currency", () => {
    const payload = buildPreferencePayload({
      orderId: "order123",
      items,
      baseUrl: "https://atelie.com",
    });
    expect(payload.items).toEqual([
      {
        id: "xicara",
        title: "Xícara",
        quantity: 2,
        unit_price: 90,
        currency_id: "BRL",
        picture_url: "https://img/x.jpg",
      },
      { id: "vaso", title: "Vaso", quantity: 1, unit_price: 95.5, currency_id: "BRL" },
    ]);
  });

  it("uses order id as external reference", () => {
    const payload = buildPreferencePayload({
      orderId: "order123",
      items,
      baseUrl: "https://atelie.com",
    });
    expect(payload.external_reference).toBe("order123");
  });

  it("configures back urls and approved auto return", () => {
    const payload = buildPreferencePayload({
      orderId: "order123",
      items,
      baseUrl: "https://atelie.com",
    });
    expect(payload.auto_return).toBe("approved");
    expect(payload.back_urls).toEqual(buildBackUrls("https://atelie.com"));
  });
});

describe("validateCheckoutInput", () => {
  it("normalizes valid input", () => {
    const result = validateCheckoutInput(" Ana ", "11 99999-9999", [
      { slug: "xicara", qty: 2 },
    ]);
    expect(result).toEqual({
      ok: true,
      name: "Ana",
      contact: "11 99999-9999",
      items: [{ slug: "xicara", qty: 2 }],
    });
  });

  it("accepts empty contact", () => {
    const result = validateCheckoutInput("Ana", "", [{ slug: "xicara", qty: 1 }]);
    expect(result.ok).toBe(true);
  });

  it("merges duplicate slugs into a single item", () => {
    const result = validateCheckoutInput("Ana", "99999", [
      { slug: "xicara", qty: 1 },
      { slug: "xicara", qty: 2 },
    ]);
    if (!result.ok) throw new Error("expected ok");
    expect(result.items).toEqual([{ slug: "xicara", qty: 3 }]);
  });

  it("rejects missing name", () => {
    const result = validateCheckoutInput("  ", "99999", [{ slug: "xicara", qty: 1 }]);
    expect(result).toEqual({ ok: false, error: "Informe seu nome." });
  });

  it("rejects empty items", () => {
    const result = validateCheckoutInput("Ana", "99999", []);
    expect(result).toEqual({ ok: false, error: "Seu carrinho está vazio." });
  });

  it("rejects non-integer or negative quantity", () => {
    const bad = validateCheckoutInput("Ana", "99999", [{ slug: "xicara", qty: 1.5 }]);
    expect(bad).toEqual({ ok: false, error: "Quantidade inválida." });
    const negative = validateCheckoutInput("Ana", "99999", [{ slug: "xicara", qty: 0 }]);
    expect(negative).toEqual({ ok: false, error: "Quantidade inválida." });
  });

  it("rejects missing slug", () => {
    const result = validateCheckoutInput("Ana", "99999", [{ qty: 1 }]);
    expect(result).toEqual({ ok: false, error: "Produto inválido no carrinho." });
  });
});

describe("parseWebhookNotification", () => {
  it("extracts payment id from query string data.id", () => {
    const sp = new URLSearchParams("?type=payment&data.id=123456");
    expect(parseWebhookNotification({ searchParams: sp, body: null })).toEqual({
      paymentId: "123456",
    });
  });

  it("extracts payment id from legacy IPN style query", () => {
    const sp = new URLSearchParams("?topic=payment&id=123456");
    expect(parseWebhookNotification({ searchParams: sp, body: null })).toEqual({
      paymentId: "123456",
    });
  });

  it("extracts payment id from JSON body", () => {
    expect(
      parseWebhookNotification({
        searchParams: new URLSearchParams(),
        body: { action: "payment.created", type: "payment", data: { id: "42" } },
      })
    ).toEqual({ paymentId: "42" });
  });

  it("ignores notifications about other resources", () => {
    const sp = new URLSearchParams();
    const merchantOrderBody = { type: "merchant_order", data: { id: "9" } };
    expect(parseWebhookNotification({ searchParams: sp, body: merchantOrderBody })).toBeNull();
    const sp2 = new URLSearchParams("?type=merchant_order&data.id=9");
    expect(parseWebhookNotification({ searchParams: sp2, body: null })).toBeNull();
  });

  it("returns null when there is no payment id at all", () => {
    expect(
      parseWebhookNotification({ searchParams: new URLSearchParams(), body: null })
    ).toBeNull();
  });
});

describe("resolveBaseUrl", () => {
  it("prefers the configured app url", () => {
    expect(resolveBaseUrl("https://atelie.com", () => null)).toBe("https://atelie.com");
  });

  it("strips trailing slash from the configured app url", () => {
    expect(resolveBaseUrl("https://atelie.com/", () => null)).toBe("https://atelie.com");
  });

  it("derives url from forwarded headers when app url is not set", () => {
    const headers: Record<string, string> = {
      "x-forwarded-proto": "https",
      "x-forwarded-host": "atelie.vercel.app",
    };
    const get = (name: string) => headers[name] ?? null;
    expect(resolveBaseUrl(undefined, get)).toBe("https://atelie.vercel.app");
  });

  it("falls back to localhost when nothing is available", () => {
    expect(resolveBaseUrl(undefined, () => null)).toBe("http://localhost:3000");
  });
});
