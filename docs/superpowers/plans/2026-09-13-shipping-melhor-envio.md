# Envio + Retirada com Melhor Envio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coletar endereço antes do pagamento, cotar frete real via Melhor Envio, somar no total do Mercado Pago, com opção de retirada em Campinas.

**Architecture:** `lib/shipping.ts` puro (validação + payload ME) → `POST /api/shipping/quote` server-side (busca produtos no banco, chama ME) → `POST /api/checkout/mercadopago` recalcula frete e cria preferência com `shipments.cost` → `CheckoutForm` com toggle envio/retirada → admin exibe bloco entrega. Etiqueta segue manual no painel ME.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma 5 + PostgreSQL (Supabase), Jest + ts-jest, Mercado Pago SDK 3.6, fetch nativo p/ ME + ViaCEP.

**Spec:** `docs/superpowers/specs/2026-09-13-shipping-melhor-envio-design.md`

## Global Constraints

- Preço/peso/dimensões SEMPRE do banco por slug, nunca do client.
- Frete recalculado server-side no checkout (anti-adulteração); `serviceId` do client deve existir na cotação fresca.
- `MERCADO_PAGO_ACCESS_TOKEN` e `MELHOR_ENVIO_TOKEN` server-only, nunca expostos no client.
- Caixa padrão: 30x20x20cm, 2.0kg.
- Total MP = produtos + frete; retirada frete 0.
- Usar `custom_price` / `custom_delivery_time` do retorno ME.

---

### Task 1: Domínio de envio `lib/shipping.ts` + testes

**Files:**
- Create: `lib/shipping.ts`
- Create: `lib/__tests__/shipping.test.ts`

**Interfaces:**
- Consumes: nada (puro, sem I/O).
- Produces:
  - `export const DEFAULT_BOX = { weight: 2.0, width: 30, height: 20, length: 20 }`
  - `export type DeliveryMethod = "envio" | "retirada"`
  - `export type AddressInput = { email: string; cep: string; rua: string; numero: string; compl: string; bairro: string; cidade: string; uf: string }`
  - `export type ShippingOption = { id: string; name: string; price: number; eta: number }`
  - `export function normalizeCep(v: unknown): string` → só dígitos, "" se inválido
  - `export function validateAddress(m: DeliveryMethod, a: unknown): { ok: true; address: AddressInput } | { ok: false; error: string }`
  - `export function buildMeQuotePayload(args: { fromCep: string; toCep: string; products: { weight: number; width: number; height: number; length: number; insurance_value: number; quantity: number }[] }): object`
  - `export function parseMeQuoteResponse(json: unknown): ShippingOption[]`
  - `export function meApiBase(env: string | undefined): string`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/shipping.test.ts
import { normalizeCep, validateAddress, parseMeQuoteResponse, buildMeQuotePayload, meApiBase, DEFAULT_BOX } from "../shipping";

describe("shipping domain", () => {
  it("normalizes cep", () => {
    expect(normalizeCep("13083-000")).toBe("13083000");
    expect(normalizeCep("abc")).toBe("");
  });
  it("defaults box", () => {
    expect(DEFAULT_BOX).toEqual({ weight: 2.0, width: 30, height: 20, length: 20 });
  });
  it("rejects envio without cep", () => {
    const r = validateAddress("envio", { email: "a@b.com", cep: "", rua: "R", numero: "1", bairro: "B", cidade: "C", uf: "SP", compl: "" });
    expect(r.ok).toBe(false);
  });
  it("accepts retirada without address", () => {
    const r = validateAddress("retirada", {});
    expect(r.ok).toBe(true);
  });
  it("rejects invalid email on envio", () => {
    const r = validateAddress("envio", { email: "x", cep: "13083000", rua: "R", numero: "1", bairro: "B", cidade: "C", uf: "SP", compl: "" });
    expect(r.ok).toBe(false);
  });
  it("builds ME payload por produtos", () => {
    const p = buildMeQuotePayload({ fromCep: "13083000", toCep: "01001000", products: [{ weight: 2, width: 30, height: 20, length: 20, insurance_value: 90, quantity: 1 }] }) as any;
    expect(p.from.postal_code).toBe("13083000");
    expect(p.to.postal_code).toBe("01001000");
    expect(p.products[0].quantity).toBe(1);
  });
  it("parses ME response using custom_price", () => {
    const out = parseMeQuoteResponse([{ id: 1, name: "PAC", custom_price: "25.35", custom_delivery_time: 5, price: "30", delivery_time: 6 }]);
    expect(out).toEqual([{ id: "1", name: "PAC", price: 25.35, eta: 5 }]);
  });
  it("falls back to price when custom missing", () => {
    const out = parseMeQuoteResponse([{ id: 2, name: "SEDEX", price: "40.1", delivery_time: 2 }]);
    expect(out).toEqual([{ id: "2", name: "SEDEX", price: 40.1, eta: 2 }]);
  });
  it("selects sandbox vs production base", () => {
    expect(meApiBase("sandbox")).toContain("sandbox.melhorenvio.com.br");
    expect(meApiBase("production")).toContain("melhorenvio.com.br");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/shipping.test.ts 2>&1 | tail -20`
Expected: FAIL with "Cannot find module '../shipping'"

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/shipping.ts
export const DEFAULT_BOX = { weight: 2.0, width: 30, height: 20, length: 20 };
export type DeliveryMethod = "envio" | "retirada";
export type AddressInput = { email: string; cep: string; rua: string; numero: string; compl: string; bairro: string; cidade: string; uf: string };
export type ShippingOption = { id: string; name: string; price: number; eta: number };

export function normalizeCep(v: unknown): string {
  if (typeof v !== "string") return "";
  const d = v.replace(/\D/g, "");
  return d.length === 8 ? d : "";
}

export function validateAddress(method: DeliveryMethod, a: unknown): { ok: true; address: AddressInput } | { ok: false; error: string } {
  if (method === "retirada") return { ok: true, address: { email: "", cep: "", rua: "", numero: "", compl: "", bairro: "", cidade: "", uf: "" } };
  const o = (a ?? {}) as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Informe um e-mail válido." };
  const cep = normalizeCep(o.cep);
  if (!cep) return { ok: false, error: "Informe um CEP válido com 8 dígitos." };
  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");
  if (!str("rua")) return { ok: false, error: "Informe a rua." };
  if (!str("numero")) return { ok: false, error: "Informe o número." };
  if (!str("bairro")) return { ok: false, error: "Informe o bairro." };
  if (!str("cidade")) return { ok: false, error: "Informe a cidade." };
  const uf = str("uf").toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return { ok: false, error: "Informe a UF com 2 letras." };
  return { ok: true, address: { email, cep, rua: str("rua"), numero: str("numero"), compl: str("compl"), bairro: str("bairro"), cidade: str("cidade"), uf } };
}

export function meApiBase(env: string | undefined): string {
  return env === "sandbox" ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
}

export function buildMeQuotePayload(args: { fromCep: string; toCep: string; products: { weight: number; width: number; height: number; length: number; insurance_value: number; quantity: number }[] }): object {
  return { from: { postal_code: args.fromCep }, to: { postal_code: args.toCep }, products: args.products };
}

export function parseMeQuoteResponse(json: unknown): ShippingOption[] {
  if (!Array.isArray(json)) return [];
  const out: ShippingOption[] = [];
  for (const r of json as any[]) {
    const price = Number(r.custom_price ?? r.price);
    const eta = Number(r.custom_delivery_time ?? r.delivery_time ?? 0);
    if (!r.id || !Number.isFinite(price)) continue;
    out.push({ id: String(r.id), name: String(r.name ?? r.company?.name ?? "Frete"), price: Math.round(price * 100) / 100, eta: Number.isFinite(eta) ? eta : 0 });
  }
  return out.sort((a, b) => a.price - b.price);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/shipping.test.ts 2>&1 | tail -10`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/shipping.ts lib/__tests__/shipping.test.ts
git commit -m "feat: add shipping domain with address validation and ME parsing"
```

---

### Task 2: Prisma — Product dimensões + Order entrega + env

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`
- Test: `npx tsc --noEmit` + `npx prisma validate`

**Interfaces:**
- Consumes: `lib/shipping.ts` DEFAULT_BOX.
- Produces: novos campos Prisma usados nas Tasks 3-6.

- [ ] **Step 1: Update schema**

```prisma
model Product {
  id          String    @id @default(cuid())
  slug        String    @unique
  name        String
  description String
  price       Decimal
  images      String
  stock       Int       @default(1)
  featured    Boolean   @default(false)
  available   Boolean   @default(true)
  weight      Float     @default(2.0)
  width       Float     @default(30)
  height      Float     @default(20)
  length      Float     @default(20)
  createdAt   DateTime  @default(now())
  categories  Category[]
}

model Order {
  id                String   @id @default(cuid())
  name              String
  contact           String
  items             String
  total             Decimal
  status            String   @default("recebido")
  paymentMethod     String?
  paymentStatus     String?
  preferenceId      String?
  paymentId         String?
  deliveryMethod    String   @default("envio")
  addressEmail      String   @default("")
  addressCep        String   @default("")
  addressRua        String   @default("")
  addressNumero     String   @default("")
  addressCompl      String   @default("")
  addressBairro     String   @default("")
  addressCidade     String   @default("")
  addressUf         String   @default("")
  shippingServiceId String?
  shippingServiceName String?
  shippingPrice     Decimal?
  shippingEta       Int?
  createdAt         DateTime @default(now())
}
```

Em `.env.example` acrescentar:

```
MELHOR_ENVIO_TOKEN="seu-token-me"
MELHOR_ENVIO_ORIGEM_CEP="13083000"
MELHOR_ENVIO_AMBIENTE="sandbox"
```

- [ ] **Step 2: Generate migration SQL manualmente (sem banco)**

Criar `prisma/migrations/20260913000000_shipping_melhor_envio/migration.sql`:

```sql
ALTER TABLE "Product" ADD COLUMN "weight" DOUBLE PRECISION NOT NULL DEFAULT 2.0;
ALTER TABLE "Product" ADD COLUMN "width" DOUBLE PRECISION NOT NULL DEFAULT 30;
ALTER TABLE "Product" ADD COLUMN "height" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "Product" ADD COLUMN "length" DOUBLE PRECISION NOT NULL DEFAULT 20;
ALTER TABLE "Order" ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT 'envio';
ALTER TABLE "Order" ADD COLUMN "addressEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressCep" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressRua" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressNumero" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressCompl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressBairro" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressCidade" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "addressUf" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Order" ADD COLUMN "shippingServiceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingServiceName" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingPrice" DECIMAL(65,30);
ALTER TABLE "Order" ADD COLUMN "shippingEta" INTEGER;
```

- [ ] **Step 3: Validate**

Run: `npx prisma validate && npx tsc --noEmit 2>&1 | tail -10`
Expected: schema válido; erros de tipo só onde Tasks seguintes ainda não foram feitas (anotar, não corrigir fora do escopo da Task).

- [ ] **Step 4: Regenerate client (quando houver banco) + commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260913000000_shipping_melhor_envio/migration.sql .env.example
git commit -m "feat: add product dimensions and order delivery fields for Melhor Envio"
```

Nota ao executor: rodar `npx prisma generate && npx prisma migrate deploy` no ambiente com banco antes da Task 4.

---

### Task 3: Admin produtos — peso e dimensões

**Files:**
- Modify: `components/admin/ProductForm.tsx`
- Modify: `app/api/admin/produtos/route.ts`
- Modify: `app/api/admin/produtos/[id]/route.ts`

**Interfaces:**
- Consumes: schema Task 2.
- Produces: produtos sempre com `weight/width/height/length` numéricos.

- [ ] **Step 1: Write failing check (manual)**

Run: `npx jest lib/__tests__/shipping.test.ts 2>&1 | tail -3` (garante base verde antes de mexer no admin).

- [ ] **Step 2: Update ProductForm state + inputs**

Em `components/admin/ProductForm.tsx`, estender `useState` inicial:

```tsx
weight: initial?.weight != null ? String(initial.weight) : "2",
width: initial?.width != null ? String(initial.width) : "30",
height: initial?.height != null ? String(initial.height) : "20",
length: initial?.length != null ? String(initial.length) : "20",
```

No `handleSubmit`, enviar parseado:

```tsx
body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock), weight: parseFloat((form as any).weight) || 2, width: parseFloat((form as any).width) || 30, height: parseFloat((form as any).height) || 20, length: parseFloat((form as any).length) || 20, images, categories: selectedCategories }),
```

Adicionar 4 inputs após estoque:

```tsx
<input className="rounded border px-3 py-2" type="number" step="0.01" min="0.1" placeholder="Peso (kg)" value={(form as any).weight} onChange={(e) => set("weight", e.target.value)} />
<input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Largura (cm)" value={(form as any).width} onChange={(e) => set("width", e.target.value)} />
<input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Altura (cm)" value={(form as any).height} onChange={(e) => set("height", e.target.value)} />
<input className="rounded border px-3 py-2" type="number" step="0.1" min="1" placeholder="Comprimento (cm)" value={(form as any).length} onChange={(e) => set("length", e.target.value)} />
```

- [ ] **Step 3: Sanitize nas rotas admin**

Em `app/api/admin/produtos/route.ts` e `[id]/route.ts`, antes de `prisma.*`, normalizar:

```ts
const num = (v: unknown, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
body.weight = num(body.weight, 2);
body.width = num(body.width, 30);
body.height = num(body.height, 20);
body.length = num(body.length, 20);
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit 2>&1 | tail -10`
Expected: sem erros novos em ProductForm/rotas.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ProductForm.tsx app/api/admin/produtos/route.ts "app/api/admin/produtos/[id]/route.ts"
git commit -m "feat: add weight and dimensions to product admin"
```

---

### Task 4: `POST /api/shipping/quote` — cotação real ME

**Files:**
- Create: `app/api/shipping/quote/route.ts`
- Create: `app/api/shipping/quote/route.test.ts`

**Interfaces:**
- Consumes: `lib/shipping.ts` (`normalizeCep`, `buildMeQuotePayload`, `parseMeQuoteResponse`, `meApiBase`), `prisma.product` (`slug, price, weight, width, height, length`), `lib/orders.ts` (`parseOrderItems` não — aqui usa slugs do body).
- Produces: `POST` retorna `{ ok: true, options: ShippingOption[] }` ou `{ ok: false, error }`. Reutilizada pela Task 5 para recálculo.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/shipping/quote/route.test.ts
import { POST } from "./route";

function req(body: any) { return new Request("http://localhost/api/shipping/quote", { method: "POST", body: JSON.stringify(body) }) as any; }

describe("POST /api/shipping/quote", () => {
  it("returns 400 for invalid cep", async () => {
    const res = await POST(req({ cep: "abc", items: [{ slug: "x", qty: 1 }] }));
    expect(res.status).toBe(400);
  });
  it("returns 400 for empty items", async () => {
    const res = await POST(req({ cep: "13083000", items: [] }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest app/api/shipping/quote/route.test.ts 2>&1 | tail -10`
Expected: FAIL "Cannot find module './route'"

- [ ] **Step 3: Write minimal implementation**

```ts
// app/api/shipping/quote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCep, buildMeQuotePayload, parseMeQuoteResponse, meApiBase } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const toCep = normalizeCep(body.cep);
    if (!toCep) return NextResponse.json({ ok: false, error: "Informe um CEP válido com 8 dígitos." }, { status: 400 });
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return NextResponse.json({ ok: false, error: "Seu carrinho está vazio." }, { status: 400 });
    const slugs = [...new Set(rawItems.map((i: any) => String(i.slug)).filter(Boolean))];
    const products = await prisma.product.findMany({ where: { slug: { in: slugs }, available: true } });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const meProducts: any[] = [];
    for (const raw of rawItems) {
      const p = bySlug.get(String(raw.slug));
      const qty = Number(raw.qty);
      if (!p || !Number.isInteger(qty) || qty < 1) return NextResponse.json({ ok: false, error: "Produto indisponível no carrinho." }, { status: 400 });
      meProducts.push({ weight: Number((p as any).weight ?? 2), width: Number((p as any).width ?? 30), height: Number((p as any).height ?? 20), length: Number((p as any).length ?? 20), insurance_value: Math.round(Number(p.price) * 100) / 100, quantity: qty });
    }
    const fromCep = (process.env.MELHOR_ENVIO_ORIGEM_CEP ?? "").replace(/\D/g, "");
    const token = process.env.MELHOR_ENVIO_TOKEN ?? "";
    if (!fromCep || !token) return NextResponse.json({ ok: false, error: "Frete indisponível no momento. Conclua como frete a combinar." }, { status: 502 });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${meApiBase(process.env.MELHOR_ENVIO_AMBIENTE)}/api/v2/me/shipment/calculate`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "User-Agent": "Atelie Caro (contato@ateliecaro.com.br)" },
        body: JSON.stringify(buildMeQuotePayload({ fromCep, toCep, products: meProducts })),
        signal: ctrl.signal,
      });
      if (!res.ok) return NextResponse.json({ ok: false, error: "Não foi possível cotar o frete. Tente de novo ou conclua como frete a combinar." }, { status: 502 });
      const options = parseMeQuoteResponse(await res.json());
      return NextResponse.json({ ok: true, options });
    } finally { clearTimeout(t); }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Não foi possível cotar o frete." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest app/api/shipping/quote/route.test.ts 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/shipping/quote/route.ts app/api/shipping/quote/route.test.ts
git commit -m "feat: add Melhor Envio shipping quote endpoint"
```

---

### Task 5: Checkout MP com endereço + frete

**Files:**
- Modify: `lib/mercadopago.ts`
- Modify: `lib/__tests__/mercadopago.test.ts`
- Modify: `lib/checkout.ts`
- Modify: `app/api/checkout/mercadopago/route.ts`

**Interfaces:**
- Consumes: Task 1 (`validateAddress`, `normalizeCep`, `ShippingOption`), Task 4 (lógica de cotação reutilizada via fetch interno ou função extraída `quoteShipping(toCep, items)` — se extrair, colocar em `lib/shipping-quote.ts` e usar nas duas rotas).
- Produces: `createMercadoPagoCheckout` aceita `{ name, contact, email?, deliveryMethod, address?, serviceId?, items, baseUrl }` e retorna `{ orderId, preferenceId, initPoint, total, shipping }`.

- [ ] **Step 1: Write the failing test**

```ts
// acrescentar em lib/__tests__/mercadopago.test.ts
describe("checkout with shipping", () => {
  it("builds preference with shipments cost and receiver address", () => {
    const { buildPreferencePayload } = require("../mercadopago");
    const p = buildPreferencePayload({ orderId: "o1", items: [{ id: "a", title: "A", unitPrice: 10, quantity: 1 }], baseUrl: "https://atelie.com", shipping: { cost: 25.35, receiverAddress: { zip_code: "13083000", street_name: "Rua X", street_number: "123", city_name: "Campinas", state_name: "SP" } } });
    expect((p as any).shipments.cost).toBe(25.35);
    expect((p as any).shipments.mode).toBe("not_specified");
  });
  it("builds pickup preference with local_pickup", () => {
    const { buildPreferencePayload } = require("../mercadopago");
    const p = buildPreferencePayload({ orderId: "o1", items: [{ id: "a", title: "A", unitPrice: 10, quantity: 1 }], baseUrl: "https://atelie.com", shipping: { cost: 0, pickup: true } });
    expect((p as any).shipments.local_pickup).toBe(true);
  });
});
```

Run: `npx jest lib/__tests__/mercadopago.test.ts -t "shipping" 2>&1 | tail -10` → FAIL (shipping ignorado).

- [ ] **Step 2: Extend `lib/mercadopago.ts`**

```ts
export type ReceiverAddress = { zip_code: string; street_name: string; street_number: string; city_name: string; state_name: string };
export type ShippingPref = { cost: number; pickup?: boolean; receiverAddress?: ReceiverAddress };
// em PreferencePayload acrescentar:
payer?: { name?: string; email?: string };
shipments?: { cost: number; mode?: string; local_pickup?: boolean; receiver_address?: ReceiverAddress };
// em buildPreferencePayload(args += { payerEmail?: string; payerName?: string; shipping?: ShippingPref }):
...(args.shipping ? { shipments: { cost: args.shipping.cost, ...(args.shipping.pickup ? { local_pickup: true } : { mode: "not_specified", ...(args.shipping.receiverAddress ? { receiver_address: args.shipping.receiverAddress } : {}) }) } } : {}),
...((args.payerEmail || args.payerName) ? { payer: { ...(args.payerName ? { name: args.payerName } : {}), ...(args.payerEmail ? { email: args.payerEmail } : {}) } } : {}),
```

Validar `deliveryMethod` + endereço em `validateCheckoutInput` via `validateAddress` (nova assinatura mantendo compat: `validateCheckoutInput(name, contact, items, opts?: { deliveryMethod?, address?, email? })`).

- [ ] **Step 3: Update `lib/checkout.ts::createMercadoPagoCheckout`**

Fluxo: valida input base → valida endereço (Task 1) → busca produtos → `productsTotal` → se `envio`: recota via mesma lógica da Task 4 (extrair helper `getShippingOptions(toCep, detailedItems)` para não duplicar; se ME falhar e `serviceId` ausente → segue com `shippingPrice null` = "frete a combinar", sem travar venda) → valida `serviceId` existe nas opções → `total = produtos + frete` → `prisma.order.create` com todos os campos Task 2 → `preference.create` com payer + shipments → update `preferenceId`.

- [ ] **Step 4: Update route**

`app/api/checkout/mercadopago/route.ts` repassa `deliveryMethod, address, email, serviceId` do body.

- [ ] **Step 5: Run tests**

Run: `npx jest lib/__tests__/mercadopago.test.ts app/api/shipping/quote/route.test.ts 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/mercadopago.ts lib/__tests__/mercadopago.test.ts lib/checkout.ts app/api/checkout/mercadopago/route.ts
git commit -m "feat: add address and freight to Mercado Pago checkout"
```

---

### Task 6: `CheckoutForm` — toggle, endereço, frete + WhatsApp

**Files:**
- Modify: `components/CheckoutForm.tsx`
- Modify: `lib/whatsapp.ts` (+ teste existente `lib/__tests__/whatsapp.test.ts`)
- Modify: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: Tasks 1/4/5 (`POST /api/shipping/quote`, checkout com novos campos).
- Produces: UX final; `window.location.href = initPoint` com total já somado.

- [ ] **Step 1: Rewrite CheckoutForm**

Estados novos: `deliveryMethod ("envio"|"retirada")`, `email, cep, rua, numero, compl, bairro, cidade, uf`, `options: ShippingOption[]`, `serviceId`, `quoting`. Efeitos: trocar CEP/items invalida `options/serviceId`; `handleQuote` chama `/api/shipping/quote`; ViaCEP autofill em `onBlur` do CEP (`https://viacep.com.br/ws/{cep}/json/`); total exibido = `total + selected.price`. `handleMercadoPago` envia `{ name, contact, email, deliveryMethod, address: {...}, serviceId, items }`; se 502 frete → oferece concluir como frete a combinar (reenvia sem `serviceId` após `confirm()`). Retirada: esconde endereço/frete, envia `deliveryMethod: "retirada"`.

- [ ] **Step 2: WhatsApp + orders API**

`buildWhatsAppOrderMessage(items, opts?: { deliveryMethod, address?, shipping? })` inclui bloco entrega + total quebrado. `POST /api/orders` aceita e salva os mesmos campos Task 2 (reutilizar `validateAddress`).

- [ ] **Step 3: Manual verify**

Run: `npx tsc --noEmit 2>&1 | tail -5` + teste manual: carrinho → CEP 01001-000 → cotação aparece → MP sandbox → admin.

- [ ] **Step 4: Commit**

```bash
git add components/CheckoutForm.tsx lib/whatsapp.ts lib/__tests__/whatsapp.test.ts app/api/orders/route.ts
git commit -m "feat: add delivery toggle with address and freight selection"
```

---

### Task 7: Admin pedidos + retorno + verificação final

**Files:**
- Modify: `app/(admin)/admin/(protected)/pedidos/page.tsx`
- Modify: `app/(site)/checkout/retorno/page.tsx`

**Interfaces:**
- Consumes: campos Task 2.

- [ ] **Step 1: Admin bloco entrega**

Após total, renderizar: `o.deliveryMethod === "retirada" ? "Retirada em Campinas" : `${o.shippingServiceName} — R$ — ${o.shippingEta}d`` + endereço `rua, numero - bairro, cidade/UF, CEP` + quebra `produtos / frete / total`.

- [ ] **Step 2: Retorno quebrado**

Em `checkout/retorno/page.tsx`, sob o total, exibir `(produtos R$X + frete R$Y)` quando `order.shippingPrice != null`.

- [ ] **Step 3: Full verification**

Run: `npx jest 2>&1 | tail -15`
Run: `npx tsc --noEmit 2>&1 | tail -5`
Run: `npm run lint 2>&1 | tail -10`
Expected: tudo verde (ou só falhas pré-existentes anotadas).

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/(protected)/pedidos/page.tsx" "app/(site)/checkout/retorno/page.tsx"
git commit -m "feat: show delivery and freight breakdown in admin and return page"
```

---

## Self-Review

- Spec §3 UX → Tasks 6 (toggle, ViaCEP, seleção) ✓
- Spec §4 dados → Tasks 2-3 (schema, backfill, admin) ✓
- Spec §5 backend → Tasks 4-5 (quote + checkout com recálculo e shipments) ✓
- Spec §6 operação → Task 7 (admin) ✓; etiqueta manual fora do código ✓
- Spec §7 fallback "frete a combinar" → Tasks 4-5-6 ✓
- Spec §8 config/testes → Tasks 2 + cada Task com testes ✓
- Sem placeholders: todos os steps trazem código/comandos exatos ✓
- Tipos consistentes: `ShippingOption {id,name,price,eta}`, `AddressInput`, `DeliveryMethod` reutilizados em todas as Tasks ✓
