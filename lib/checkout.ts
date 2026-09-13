// lib/checkout.ts
// Server-only: integração Checkout Pro (SDK Backend) + Prisma.
// NUNCA importar em componentes client-side.
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/images";
import {
  buildPreferencePayload,
  orderStatusFromPaymentStatus,
  resolveBaseUrl,
  validateCheckoutInput,
  PreferenceItemInput,
  ReceiverAddress,
} from "@/lib/mercadopago";
import { parseOrderItems } from "@/lib/orders";
import {
  getShippingOptions,
  ShippingQuoteError,
  toMeProduct,
} from "@/lib/shipping-quote";

// Erro com mensagem amigável para o cliente (vira 400 na rota).
export class CheckoutError extends Error {}

// Erro derivado do frete (vira 502 na rota; o client oferece frete a combinar).
export class FreightCheckoutError extends CheckoutError {}

function mpClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
    throw new CheckoutError("Pagamento indisponível no momento.");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function getBaseUrl(req: Request): string {
  return resolveBaseUrl(process.env.NEXT_PUBLIC_APP_URL, (name) =>
    req.headers.get(name)
  );
}

export type CheckoutShippingResult = {
  price: number | null;
  serviceId: string | null;
  serviceName: string | null;
  eta: number | null;
};

// Cria o pedido no banco e a preferência no Mercado Pago. Preços e estoque
// vêm SEMPRE do banco — o client só informa slug e quantidade.
// O frete é SEMPRE recalculado server-side via Melhor Envio (anti-adulteração):
// se a cotação falhar e nenhum serviceId foi enviado, o pedido segue como
// "frete a combinar" (shippingPrice null) sem travar a venda.
export async function createMercadoPagoCheckout({
  name,
  contact,
  email,
  deliveryMethod,
  address,
  serviceId,
  items,
  baseUrl,
}: {
  name: unknown;
  contact: unknown;
  email?: unknown;
  deliveryMethod?: unknown;
  address?: unknown;
  serviceId?: unknown;
  items: unknown;
  baseUrl: string;
}): Promise<{
  orderId: string;
  preferenceId: string;
  initPoint: string;
  total: number;
  shipping: CheckoutShippingResult;
}> {
  // deliveryMethod é obrigatório — sem fallback legado: direto na API sem
  // o enum geraria pedido "envio" sem endereço.
  const input = validateCheckoutInput(name, contact, items, {
    deliveryMethod,
    address,
    email,
  });
  if (!input.ok) throw new CheckoutError(input.error);

  const method = input.deliveryMethod;
  const addr = input.address;
  const payerEmail = input.email || (typeof email === "string" ? email.trim() : "");

  const products = await prisma.product.findMany({
    where: { slug: { in: input.items.map((i) => i.slug) }, available: true },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const orderItems: { slug: string; name: string; qty: number; unitPrice: number }[] = [];
  const preferenceItems: PreferenceItemInput[] = [];
  const meProducts: Parameters<typeof getShippingOptions>[1] = [];
  for (const { slug, qty } of input.items) {
    const product = bySlug.get(slug);
    if (!product) throw new CheckoutError(`Produto indisponível: ${slug}`);
    if (product.stock < qty)
      throw new CheckoutError(`Estoque insuficiente para "${product.name}".`);
    const unitPrice = Math.round(Number(product.price) * 100) / 100;
    orderItems.push({ slug, name: product.name, qty, unitPrice });
    preferenceItems.push({
      id: product.slug,
      title: product.name,
      unitPrice,
      quantity: qty,
      pictureUrl: parseImages(product.images)[0],
    });
    meProducts.push(toMeProduct(product as any, qty));
  }
  if (orderItems.length === 0) throw new CheckoutError("Seu carrinho está vazio.");

  const productsTotal = orderItems.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  // Recalcula o frete server-side.
  let shipping: CheckoutShippingResult = {
    price: null,
    serviceId: null,
    serviceName: null,
    eta: null,
  };
  if (method === "retirada") {
    shipping = { price: 0, serviceId: null, serviceName: null, eta: null };
  } else if (method === "envio" && addr) {
    const wantedServiceId =
      typeof serviceId === "string" && serviceId ? serviceId : null;
    let options: Awaited<ReturnType<typeof getShippingOptions>> | null = null;
    try {
      options = await getShippingOptions(addr.cep, meProducts);
    } catch (e) {
      if (e instanceof ShippingQuoteError && !wantedServiceId) {
        options = null; // frete a combinar
      } else if (e instanceof ShippingQuoteError) {
        throw new FreightCheckoutError(e.message);
      } else {
        throw e;
      }
    }
    if (options && wantedServiceId) {
      const sel = options.find((o) => o.id === wantedServiceId);
      if (!sel)
        throw new FreightCheckoutError("Serviço de frete inválido. Cote novamente.");
      shipping = {
        price: sel.price,
        serviceId: sel.id,
        serviceName: sel.name,
        eta: sel.eta,
      };
    }
    // Sem serviceId (ou com ME fora do ar): frete a combinar, sem travar a venda.
  }

  const total =
    Math.round((productsTotal + (shipping.price ?? 0)) * 100) / 100;
  const order = await prisma.order.create({
    data: {
      name: input.name,
      contact: input.contact,
      items: JSON.stringify(orderItems),
      total,
      status: "aguardando_pagamento",
      paymentMethod: "mercadopago",
      paymentStatus: "pending",
      deliveryMethod: method,
      addressEmail: addr?.email ?? "",
      addressCep: addr?.cep ?? "",
      addressRua: addr?.rua ?? "",
      addressNumero: addr?.numero ?? "",
      addressCompl: addr?.compl ?? "",
      addressBairro: addr?.bairro ?? "",
      addressCidade: addr?.cidade ?? "",
      addressUf: addr?.uf ?? "",
      shippingServiceId: shipping.serviceId,
      shippingServiceName: shipping.serviceName,
      shippingPrice: shipping.price,
      shippingEta: shipping.eta,
    },
  });

  const receiverAddress: ReceiverAddress | undefined =
    method === "envio" && addr && addr.cep
      ? {
          zip_code: addr.cep,
          street_name: addr.rua,
          street_number: addr.numero,
          city_name: addr.cidade,
          state_name: addr.uf,
        }
      : undefined;

  const preference = new Preference(mpClient());
  const result = await preference.create({
    body: buildPreferencePayload({
      orderId: order.id,
      items: preferenceItems,
      baseUrl,
      payerName: input.name,
      ...(payerEmail ? { payerEmail } : {}),
      ...(method === "retirada"
        ? { shipping: { cost: 0, pickup: true } }
        : shipping.price !== null
          ? {
              shipping: {
                cost: shipping.price,
                ...(receiverAddress ? { receiverAddress } : {}),
              },
            }
          : {}),
    }),
    requestOptions: { idempotencyKey: order.id },
  });
  if (!result.id || !result.init_point)
    throw new Error("Resposta da preferência incompleta");

  await prisma.order.update({
    where: { id: order.id },
    data: { preferenceId: result.id },
  });

  return {
    orderId: order.id,
    preferenceId: result.id,
    initPoint: result.init_point,
    total,
    shipping,
  };
}

export async function fetchMercadoPagoPayment(paymentId: string | number) {
  const payment = new Payment(mpClient());
  return payment.get({ id: Number(paymentId) });
}

// Aplica o status de um pagamento ao pedido correspondente (via
// external_reference). Idempotente: a baixa de estoque acontece apenas uma
// vez, na transição pendente → aprovado, mesmo com webhooks duplicados ou
// concorrentes com a verificação da página de retorno.
export async function applyMercadoPagoPaymentToOrder(payment: {
  id?: number | string;
  status?: string;
  external_reference?: string | null;
}): Promise<void> {
  const orderId = payment.external_reference;
  const status = payment.status;
  if (!orderId || !status) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const paymentId = payment.id !== undefined ? String(payment.id) : undefined;
  const orderStatus = orderStatusFromPaymentStatus(status);

  if (status === "approved" && order.paymentStatus !== "approved") {
    await prisma.$transaction(async (tx) => {
      const res = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "approved" } },
        data: {
          paymentStatus: "approved",
          status: "pago",
          ...(paymentId ? { paymentId } : {}),
        },
      });
      if (res.count === 1) {
        for (const item of parseOrderItems(order.items)) {
          await tx.product.update({
            where: { slug: item.slug },
            data: { stock: { decrement: item.qty } },
          });
        }
      }
    });
    return;
  }

  if (status === "refunded" || status === "charged_back") {
    // reembolso/chargeback também podem acontecer após a aprovação
    await prisma.order.updateMany({
      where: { id: order.id },
      data: { paymentStatus: status, status: orderStatus, ...(paymentId ? { paymentId } : {}) },
    });
    return;
  }

  // demais status nunca regredem um pedido já aprovado
  await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: "approved" } },
    data: { paymentStatus: status, status: orderStatus, ...(paymentId ? { paymentId } : {}) },
  });
}
