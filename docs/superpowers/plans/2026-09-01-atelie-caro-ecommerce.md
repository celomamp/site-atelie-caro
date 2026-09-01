# Ateliê Carô — E-commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Next.js e-commerce for Ateliê Carô selling ceramic pieces, custom orders, and workshops, with orders sent via WhatsApp and a password-protected admin panel.

**Architecture:** Next.js 14+ App Router with server-rendered public vitrine and an isolated admin section. Cart lives client-side (localStorage) and produces a formatted WhatsApp message. Prisma + SQLite store products, workshops, custom orders, and cart orders. Admin authenticated via a single `ADMIN_PASSWORD` env var using a signed cookie session.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, SQLite, React Context for cart state.

**Spec:** `docs/superpowers/specs/2026-09-01-atelie-caro-ecommerce-design.md`

## Global Constraints

- Next.js 14+ with App Router, TypeScript, Tailwind CSS, Prisma, SQLite.
- All code comments in Portuguese or none; UI copy in Brazilian Portuguese (pt-BR).
- Design tokens (from spec §3): `cobalt #1B4FD8`, `magenta #E8197B`, `terracotta #C66A46`, `clay #A8573C`, `cream #FAF6F0`, `blush #F6E7EF`, `ink #2B2430`.
- Typography: `Playfair Display` for headings, `Montserrat` for body/UI, optional `Pacifico` for subtle cursive accents.
- Contact/WhatsApp data comes from `.env` (`NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_HOURS`), never hardcoded.
- Admin auth via `ADMIN_PASSWORD` in `.env`; session stored in signed cookie.
- Images uploaded to `public/uploads`.
- Out of scope (do not implement): payment gateways, multi-user/RBAC, automatic shipping calc, product variants.

---

### Task 1: Scaffold Next.js app, Tailwind, Prisma + SQLite

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `.env`, `app/layout.tsx`, `app/globals.css`
- Create: `prisma/schema.prisma`

**Interfaces:**
- Produces: base project that runs `npm run dev`; `prisma` client available for later tasks.

- [ ] **Step 1: Write package.json and config**

```json
{
  "name": "atelie-caro",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@prisma/client": "5.18.0",
    "bcryptjs": "2.4.3",
    "iron-session": "8.0.3"
  },
  "devDependencies": {
    "@types/node": "20.14.15",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.20",
    "postcss": "8.4.41",
    "prisma": "5.18.0",
    "tailwindcss": "3.4.9",
    "tsx": "4.17.0",
    "typescript": "5.5.4"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write next.config.mjs, tailwind.config.ts, postcss.config.mjs**

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cobalt: "#1B4FD8",
        magenta: "#E8197B",
        terracotta: "#C66A46",
        clay: "#A8573C",
        cream: "#FAF6F0",
        blush: "#F6E7EF",
        ink: "#2B2430",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-montserrat)", "sans-serif"],
        cursive: ["var(--font-pacifico)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
```

```js
// postcss.config.mjs
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 4: Write .gitignore, .env.example, .env**

```gitignore
# .gitignore
node_modules/
.next/
out/
*.tsbuildinfo
next-env.d.ts
prisma/dev.db
prisma/dev.db-journal
.env
public/uploads/*
!public/uploads/.gitkeep
```

```bash
# .env.example
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="troque-esta-senha"
NEXT_PUBLIC_WHATSAPP="5511999999999"
NEXT_PUBLIC_INSTAGRAM="https://instagram.com/ateliecaro"
NEXT_PUBLIC_ADDRESS="Campinas-SP"
NEXT_PUBLIC_HOURS="Ter a Sáb, 9h-18h"
NEXT_PUBLIC_SITE_NAME="Ateliê Carô"
```

```bash
# .env (copy of example, with real values)
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="admin123"
NEXT_PUBLIC_WHATSAPP="5511999999999"
NEXT_PUBLIC_INSTAGRAM="https://instagram.com/ateliecaro"
NEXT_PUBLIC_ADDRESS="Campinas-SP"
NEXT_PUBLIC_HOURS="Ter a Sáb, 9h-18h"
NEXT_PUBLIC_SITE_NAME="Ateliê Carô"
```

- [ ] **Step 5: Write prisma/schema.prisma (from spec §4)**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  price       Decimal
  category    String
  images      String[]
  stock       Int      @default(1)
  featured    Boolean  @default(false)
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Workshop {
  id           String   @id @default(cuid())
  slug         String   @unique
  title        String
  description  String
  date         DateTime
  duration     Int
  price        Decimal
  location     String
  maxAttendees Int
  spotsTaken   Int      @default(0)
  image        String?
  active       Boolean  @default(true)
}

model CustomOrder {
  id          String   @id @default(cuid())
  name        String
  contact     String
  description String
  status      String   @default("nova")
  createdAt   DateTime @default(now())
}

model Order {
  id        String   @id @default(cuid())
  name      String
  contact   String
  items     Json
  total     Decimal
  status    String   @default("recebido")
  createdAt DateTime @default(now())
}
```

- [ ] **Step 6: Write app/globals.css and app/layout.tsx**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-playfair: "Playfair Display", serif;
  --font-montserrat: "Montserrat", sans-serif;
  --font-pacifico: "Pacifico", cursive;
}

body {
  @apply bg-cream text-ink font-body;
}
```

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Pacifico } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

export const metadata: Metadata = {
  title: "Ateliê Carô — Cerâmica Artesanal",
  description:
    "Peças de cerâmica artesanal de alta temperatura, encomendas personalizadas e oficinas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${montserrat.variable} ${pacifico.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Install deps, generate client, push schema**

Run:
```bash
npm install
npx prisma generate
npx prisma db push
```

Expected: install succeeds, `prisma/client` generated, SQLite file `prisma/dev.db` created.

- [ ] **Step 8: Verify dev server boots**

Run:
```bash
npm run dev
```
Open `http://localhost:3000` — a blank cream page renders without error.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold next.js app with tailwind, prisma and sqlite"
```

---

### Task 2: Prisma client singleton + site config + seed data

**Files:**
- Create: `lib/prisma.ts`, `lib/config.ts`, `prisma/seed.ts`, `public/uploads/.gitkeep`
- Modify: `package.json` (seed path already set in Task 1)

**Interfaces:**
- Consumes: `prisma/schema.prisma` from Task 1.
- Produces: `prisma` singleton export; `SITE` config object with `whatsapp`, `instagram`, `address`, `hours`, `siteName`; seed data for products and workshops.

- [ ] **Step 1: Write the failing test for config**

Create `lib/__tests__/config.test.ts`:

```ts
import { SITE } from "../config";

describe("SITE config", () => {
  it("exposes whatsapp number from env", () => {
    expect(SITE.whatsapp).toBeDefined();
    expect(SITE.whatsapp).toMatch(/^\d+$/);
  });
  it("exposes site name", () => {
    expect(SITE.siteName).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/config.test.ts`
Expected: FAIL (config module not found / jest not configured). Add a minimal `jest.config.js` and `test` script if needed:
```js
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
};
```
Run: `npm i -D jest ts-jest @types/jest`

- [ ] **Step 3: Write minimal config implementation**

```ts
// lib/config.ts
export const SITE = {
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM || "",
  address: process.env.NEXT_PUBLIC_ADDRESS || "",
  hours: process.env.NEXT_PUBLIC_HOURS || "",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Ateliê Carô",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/config.test.ts`
Expected: PASS

- [ ] **Step 5: Write prisma singleton**

```ts
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Write seed data**

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { slug: "xicara-de-ceramica" },
    update: {},
    create: {
      slug: "xicara-de-ceramica",
      name: "Xícara de Cerâmica",
      description: "Xícara artesanal esmaltada, feita à mão em alta temperatura.",
      price: 90,
      category: "utensilios",
      images: ["/uploads/xicara.jpg"],
      stock: 5,
      featured: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "vaso-terracota" },
    update: {},
    create: {
      slug: "vaso-terracota",
      name: "Vaso Terracota",
      description: "Vaso em tom terracota com textura de barro.",
      price: 95,
      category: "decoracao",
      images: ["/uploads/vaso.jpg"],
      stock: 3,
      featured: true,
    },
  });

  await prisma.workshop.upsert({
    where: { slug: "oficina-ceramica-iniciante" },
    update: {},
    create: {
      slug: "oficina-ceramica-iniciante",
      title: "Oficina de Cerâmica Artesanal",
      description: "Aprenda modelagem e esmaltação em alta temperatura.",
      date: new Date("2026-10-10T14:00:00"),
      duration: 180,
      price: 220,
      location: "Campinas-SP",
      maxAttendees: 8,
      image: "/uploads/oficina.jpg",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 7: Run seed**

Run:
```bash
npx prisma db seed
npx prisma studio
```
Expected: 2 products and 1 workshop in the database.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add prisma singleton, site config and seed data"
```

---

### Task 3: Cart context (localStorage) + WhatsApp message builder

**Files:**
- Create: `lib/cart.ts` (types + helpers), `lib/whatsapp.ts`, `components/CartContext.tsx`, `components/providers.tsx`
- Modify: `app/layout.tsx` (wrap children in providers)

**Interfaces:**
- Consumes: `SITE` config from Task 2.
- Produces:
  - `CartItem = { slug: string; name: string; unitPrice: number; qty: number; image?: string }`
  - `CartContext` exposing `{ items, addItem, removeItem, setQty, clear, total, count }`.
  - `buildWhatsAppOrderMessage(items: CartItem[]): string`.
  - `whatsappLink(message: string): string`.

- [ ] **Step 1: Write the failing test for whatsapp message builder**

Create `lib/__tests__/whatsapp.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/__tests__/whatsapp.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write implementation**

```ts
// lib/cart.ts
export type CartItem = {
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  image?: string;
};

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
```

```ts
// lib/whatsapp.ts
import { SITE } from "./config";
import { CartItem, formatBRL } from "./cart";

export function buildWhatsAppOrderMessage(items: CartItem[]): string {
  const lines = items.map(
    (i) => `• ${i.name} — ${i.qty}x — ${formatBRL(i.unitPrice * i.qty)}`
  );
  const total = items.reduce((acc, i) => acc + i.unitPrice * i.qty, 0);
  return [
    "Olá, Ateliê Carô! Gostaria de fazer um pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatBRL(total)}`,
  ].join("\n");
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/__tests__/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 5: Write cart context + provider**

```tsx
// components/CartContext.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { CartItem } from "@/lib/cart";

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | undefined>(undefined);
const STORAGE_KEY = "atelie-caro-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const total = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);

  const addItem = (item: CartItem) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug);
      if (existing)
        return prev.map((i) =>
          i.slug === item.slug ? { ...i, qty: i.qty + item.qty } : i
        );
      return [...prev, item];
    });

  const removeItem = (slug: string) =>
    setItems((prev) => prev.filter((i) => i.slug !== slug));

  const setQty = (slug: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, qty } : i))
    );

  const clear = () => setItems([]);

  return (
    <CartContext.Provider
      value={{ items, count, total, addItem, removeItem, setQty, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

```tsx
// components/providers.tsx
"use client";
import { CartProvider } from "./CartContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
```

- [ ] **Step 6: Wire provider into layout**

Modify `app/layout.tsx` to wrap `<body>` children:
```tsx
import { Providers } from "@/components/providers";
...
<body className={...}>
  <Providers>{children}</Providers>
</body>
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: builds successfully with no type errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add cart context and whatsapp message builder"
```

---

### Task 4: Header, footer and site layout

**Files:**
- Create: `components/Header.tsx`, `components/Footer.tsx`, `components/CartButton.tsx`
- Create: `app/(site)/layout.tsx`

**Interfaces:**
- Consumes: `useCart` from Task 3, `SITE` config from Task 2.
- Produces: shared site layout with responsive header (hamburger menu) and footer. `CartButton` shows count badge.

- [ ] **Step 1: Write CartButton (uses cart count)**

```tsx
// components/CartButton.tsx
"use client";
import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/carrinho" className="relative inline-flex items-center gap-1 text-white">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Carrinho
      {count > 0 && (
        <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-magenta text-xs font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Write Header**

```tsx
// components/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import CartButton from "./CartButton";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/produtos", label: "Produtos" },
  { href: "/encomendas", label: "Encomendas" },
  { href: "/oficinas", label: "Oficinas" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-cobalt text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-2xl font-bold">
          Ateliê <span className="text-magenta">Carô</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-blush">
              {n.label}
            </Link>
          ))}
          <CartButton />
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-3 px-4 pb-4 md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <CartButton />
        </nav>
      )}
    </header>
  );
}
```

- [ ] **Step 3: Write Footer**

```tsx
// components/Footer.tsx
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="bg-cobalt text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold">Ateliê <span className="text-magenta">Carô</span></p>
          <p className="mt-2 text-sm">Cerâmica artesanal de alta temperatura.</p>
        </div>
        <div>
          <p className="font-semibold">Contato</p>
          <p className="mt-2 text-sm">WhatsApp: {SITE.whatsapp}</p>
          <p className="text-sm">Instagram: {SITE.instagram}</p>
        </div>
        <div>
          <p className="font-semibold">Localização</p>
          <p className="mt-2 text-sm">{SITE.address}</p>
          <p className="text-sm">{SITE.hours}</p>
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-xs">
        © {new Date().getFullYear()} Ateliê Carô. Todos os direitos reservados.
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Write site layout**

```tsx
// app/(site)/layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Verify build + render**

Run: `npm run build`
Expected: builds without errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add header, footer and site layout"
```

---

### Task 5: Home page

**Files:**
- Create: `app/(site)/page.tsx`, `components/ProductCard.tsx`

**Interfaces:**
- Consumes: `prisma` from Task 2 (query featured products + upcoming workshops).
- Produces: home page with hero, category grid, featured products, workshops band, custom order block; `ProductCard` reused by catalog.

- [ ] **Step 1: Write ProductCard**

```tsx
// components/ProductCard.tsx
import Link from "next/link";
import { formatBRL } from "@/lib/cart";

type Product = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  available: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square bg-cream">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg">{product.name}</h3>
        <p className="mt-1 font-semibold text-magenta">{formatBRL(Number(product.price))}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Write home page**

```tsx
// app/(site)/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true, available: true },
    take: 4,
  });
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    orderBy: { date: "asc" },
    take: 2,
  });

  return (
    <div>
      <section className="bg-cobalt text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="font-cursive text-xl text-blush">Cerâmica artesanal</p>
          <h1 className="mt-2 font-display text-5xl font-bold md:text-6xl">
            Peças únicas, <span className="text-magenta">feitas à mão</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl">
            Cerâmica de alta temperatura produzida artesanalmente no Ateliê Carô.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/produtos" className="rounded bg-magenta px-6 py-3 font-semibold">
              Ver produtos
            </Link>
            <Link href="/encomendas" className="rounded border border-white px-6 py-3 font-semibold">
              Encomendar
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 grid gap-4 text-center md:grid-cols-3">
          <Link href="/produtos?categoria=utensilios" className="rounded bg-blush p-6 hover:bg-pink-100">
            <h3 className="font-display text-xl">Utensílios</h3>
          </Link>
          <Link href="/produtos?categoria=decoracao" className="rounded bg-blush p-6 hover:bg-pink-100">
            <h3 className="font-display text-xl">Decoração</h3>
          </Link>
          <Link href="/encomendas" className="rounded bg-blush p-6 hover:bg-pink-100">
            <h3 className="font-display text-xl">Encomendas</h3>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 font-display text-3xl font-bold">Destaques</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-12 bg-terracotta text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl font-bold">Oficinas de Cerâmica</h2>
          <p className="mt-2">Venha colocar a mão na massa.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/oficinas" className="rounded bg-cobalt px-6 py-3 font-semibold">
              Ver oficinas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify render**

Run: `npm run dev`
Open `http://localhost:3000` — home shows hero, categories, featured products, workshops band.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add home page and product card"
```

---

### Task 6: Catalog and product detail pages

**Files:**
- Create: `app/(site)/produtos/page.tsx`, `app/(site)/produtos/[slug]/page.tsx`, `components/AddToCartButton.tsx`

**Interfaces:**
- Consumes: `prisma`, `useCart`/`addItem` from Task 3, `formatBRL` from Task 3.
- Produces: catalog with category filter + sorting + stock badge; product detail with gallery, quantity selector, add-to-cart.

- [ ] **Step 1: Write AddToCartButton (client)**

```tsx
// components/AddToCartButton.tsx
"use client";
import { useState } from "react";
import { useCart } from "./CartContext";

type Props = {
  slug: string;
  name: string;
  price: number;
  image?: string;
};

export default function AddToCartButton({ slug, name, price, image }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center rounded border border-gray-300">
        <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
        <span className="w-8 text-center">{qty}</span>
        <button className="px-3 py-2" onClick={() => setQty(qty + 1)}>+</button>
      </div>
      <button
        className="rounded bg-cobalt px-6 py-3 font-semibold text-white hover:bg-blue-700"
        onClick={() => addItem({ slug, name, unitPrice: price, qty, image })}
      >
        Adicionar ao carrinho
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write catalog page**

```tsx
// app/(site)/produtos/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { value: "utensilios", label: "Utensílios" },
  { value: "decoracao", label: "Decoração" },
  { value: "vasos", label: "Vasos" },
];

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { categoria?: string; ordenar?: string };
}) {
  const cat = searchParams.categoria;
  const order = searchParams.ordenar;

  const products = await prisma.product.findMany({
    where: { available: true, ...(cat ? { category: cat } : {}) },
    orderBy:
      order === "menor"
        ? { price: "asc" }
        : order === "maior"
        ? { price: "desc" }
        : { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Produtos</h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/produtos" className="rounded border border-cobalt px-3 py-1 text-sm">Todos</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/produtos?categoria=${c.value}`}
              className={`rounded border px-3 py-1 text-sm ${
                cat === c.value ? "bg-cobalt text-white" : "border-cobalt"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <select
          className="rounded border border-gray-300 px-3 py-1 text-sm"
          onChange={(e) => {
            const v = e.target.value;
            window.location.href = `/produtos?${cat ? `categoria=${cat}&` : ""}ordenar=${v}`;
          }}
        >
          <option value="">Ordenar</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
        </select>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-gray-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.slug} className="relative">
              <ProductCard product={p} />
              {p.stock <= 0 && (
                <span className="absolute right-2 top-2 rounded bg-clay px-2 py-1 text-xs font-bold text-white">
                  Esgotado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write product detail page**

```tsx
// app/(site)/produtos/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import AddToCartButton from "@/components/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });

  if (!product || !product.available) notFound();

  const image = product.images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-cream">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-magenta">{formatBRL(Number(product.price))}</p>
          <p className="mt-4 leading-relaxed text-gray-700">{product.description}</p>
          {product.stock <= 0 ? (
            <p className="mt-6 rounded bg-clay px-4 py-2 font-semibold text-white">Esgotado</p>
          ) : (
            <div className="mt-6">
              <p className="mb-2 text-sm text-gray-500">{product.stock} em estoque</p>
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                price={Number(product.price)}
                image={image}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify render**

Run: `npm run dev`
Open `/produtos` and `/produtos/xicara-de-ceramica` — catalog filters and product detail work; add to cart updates the badge.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add catalog and product detail pages"
```

---

### Task 7: Cart page with WhatsApp checkout

**Files:**
- Create: `app/(site)/carrinho/page.tsx`, `components/CheckoutForm.tsx`
- Create: `app/api/orders/route.ts`

**Interfaces:**
- Consumes: `useCart` (items, setQty, removeItem, clear, total), `buildWhatsAppOrderMessage`, `whatsappLink`, `prisma`.
- Produces: cart page where the user edits quantities and sends the order to WhatsApp (optionally recording it via `POST /api/orders`).

- [ ] **Step 1: Write the failing test for the orders API**

Create `app/api/orders/route.test.ts` (logic extracted to `lib/orders.ts` for testability):

```ts
import { buildOrderRecord } from "@/lib/orders";

describe("buildOrderRecord", () => {
  it("computes total from items", () => {
    const rec = buildOrderRecord("Ana", "5511", [
      { slug: "xicara", name: "Xícara", unitPrice: 90, qty: 2 },
    ]);
    expect(rec.items).toHaveLength(1);
    expect(Number(rec.total)).toBe(180);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest app/api/orders/route.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Write order record builder + API route**

```ts
// lib/orders.ts
import { CartItem } from "./cart";

export function buildOrderRecord(name: string, contact: string, items: CartItem[]) {
  const total = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  return {
    name,
    contact,
    items: items.map((i) => ({
      slug: i.slug,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
    })),
    total,
  };
}
```

```ts
// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderRecord } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const record = buildOrderRecord(body.name, body.contact, body.items);
    const order = await prisma.order.create({ data: record });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest app/api/orders/route.test.ts`
Expected: PASS

- [ ] **Step 5: Write CheckoutForm**

```tsx
// components/CheckoutForm.tsx
"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import { buildWhatsAppOrderMessage, whatsappLink } from "@/lib/whatsapp";

export default function CheckoutForm() {
  const { items, total, clear } = useCart();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  function handleSend() {
    const message = buildWhatsAppOrderMessage(items);
    window.open(whatsappLink(message), "_blank");
    if (name && contact) {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, items }),
      }).catch(() => {});
    }
    clear();
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="font-display text-xl font-bold">Finalizar pedido</h2>
      <div className="mt-4 flex flex-col gap-3">
        <input
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="WhatsApp (opcional)"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          Total: <span className="font-bold text-magenta">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
        </p>
        <button
          onClick={handleSend}
          className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700"
        >
          Enviar pedido pelo WhatsApp
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write cart page**

```tsx
// app/(site)/carrinho/page.tsx
"use client";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { formatBRL } from "@/lib/cart";
import CheckoutForm from "@/components/CheckoutForm";

export default function CarrinhoPage() {
  const { items, setQty, removeItem } = useCart();

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Seu carrinho está vazio</h1>
        <Link href="/produtos" className="mt-6 inline-block rounded bg-cobalt px-6 py-3 font-semibold text-white">
          Ver produtos
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Carrinho</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          {items.map((i) => (
            <div key={i.slug} className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow">
              <div>
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-magenta">{formatBRL(i.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded border border-gray-300">
                  <button className="px-2" onClick={() => setQty(i.slug, i.qty - 1)}>−</button>
                  <span className="w-6 text-center">{i.qty}</span>
                  <button className="px-2" onClick={() => setQty(i.slug, i.qty + 1)}>+</button>
                </div>
                <button onClick={() => removeItem(i.slug)} className="text-clay">Remover</button>
              </div>
            </div>
          ))}
        </div>
        <CheckoutForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify render + order API**

Run: `npm run dev`
Add items, open `/carrinho`, adjust quantities, click send — WhatsApp link opens with formatted message.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add cart page with whatsapp checkout and orders api"
```

---

### Task 8: Encomendas (custom orders) page

**Files:**
- Create: `app/(site)/encomendas/page.tsx`, `components/EncomendaForm.tsx`
- Create: `app/api/encomendas/route.ts`

**Interfaces:**
- Consumes: `SITE` config, `whatsappLink`, `prisma`.
- Produces: custom order page with a form that builds a WhatsApp message and optionally records a `CustomOrder` via `POST /api/encomendas`.

- [ ] **Step 1: Write EncomendaForm**

```tsx
// components/EncomendaForm.tsx
"use client";
import { useState } from "react";
import { SITE } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export default function EncomendaForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [desc, setDesc] = useState("");

  function handleSend() {
    const message = [
      "Olá, Ateliê Carô! Gostaria de solicitar um orçamento de encomenda:",
      "",
      `Nome: ${name}`,
      `Contato: ${contact}`,
      "",
      "Descrição da peça:",
      desc,
    ].join("\n");
    window.open(whatsappLink(message), "_blank");
    if (name && contact && desc) {
      fetch("/api/encomendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, description: desc }),
      }).catch(() => {});
    }
    setName(""); setContact(""); setDesc("");
  }

  return (
    <form
      className="rounded-lg bg-white p-6 shadow"
      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
    >
      <div className="flex flex-col gap-4">
        <input className="rounded border border-gray-300 px-3 py-2" placeholder="Seu nome" value={name}
          onChange={(e) => setName(e.target.value)} />
        <input className="rounded border border-gray-300 px-3 py-2" placeholder="WhatsApp / contato" value={contact}
          onChange={(e) => setContact(e.target.value)} />
        <textarea className="rounded border border-gray-300 px-3 py-2" rows={5} placeholder="Descreva a peça que você quer (tipo, tamanho, cores...)"
          value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button className="rounded bg-magenta px-6 py-3 font-semibold text-white hover:bg-pink-700">
          Solicitar orçamento pelo WhatsApp
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write encomendas API route**

```ts
// app/api/encomendas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = await prisma.customOrder.create({
      data: {
        name: body.name,
        contact: body.contact,
        description: body.description,
      },
    });
    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 3: Write encomendas page**

```tsx
// app/(site)/encomendas/page.tsx
import EncomendaForm from "@/components/EncomendaForm";

export default function EncomendasPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Encomendas Personalizadas</h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Quer uma peça única? Descreva o que você imagina e enviamos um orçamento pelo WhatsApp.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">1. Descreva</h3>
          <p className="mt-2 text-sm">Conte o tipo, tamanho, cores e uso da peça.</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">2. Receba o orçamento</h3>
          <p className="mt-2 text-sm">Respondemos com preço e prazo pelo WhatsApp.</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">3. Aprove</h3>
          <p className="mt-2 text-sm">Confirmamos a produção da sua peça exclusiva.</p>
        </div>
      </div>
      <div className="mt-8">
        <EncomendaForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify render + API**

Run: `npm run dev`
Open `/encomendas` — form sends WhatsApp message and records custom order.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add custom orders (encomendas) page and api"
```

---

### Task 9: Oficinas (workshops) list and detail

**Files:**
- Create: `app/(site)/oficinas/page.tsx`, `app/(site)/oficinas/[slug]/page.tsx`

**Interfaces:**
- Consumes: `prisma`, `SITE` config, `whatsappLink`.
- Produces: workshop list (date/duration/location/spots/price) and detail page with a WhatsApp registration CTA.

- [ ] **Step 1: Write workshops list page**

```tsx
// app/(site)/oficinas/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function OficinasPage() {
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Oficinas de Cerâmica</h1>
      <p className="mt-2 text-gray-600">Coloque a mão na massa e aprenda cerâmica artesanal.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {workshops.map((w) => (
          <Link key={w.slug} href={`/oficinas/${w.slug}`} className="rounded-lg bg-white p-6 shadow hover:shadow-md">
            <h3 className="font-display text-2xl font-bold">{w.title}</h3>
            <p className="mt-3 text-sm text-gray-600">
              📅 {new Date(w.date).toLocaleDateString("pt-BR")} · ⏱ {w.duration} min · 📍 {w.location}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-bold text-magenta">{formatBRL(Number(w.price))}</p>
              <p className="text-sm text-gray-500">
                {w.maxAttendees - w.spotsTaken} vagas restantes
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write workshop detail page**

```tsx
// app/(site)/oficinas/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";
import { SITE } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function WorkshopDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const workshop = await prisma.workshop.findUnique({
    where: { slug: params.slug },
  });

  if (!workshop || !workshop.active) notFound();

  const spots = workshop.maxAttendees - workshop.spotsTaken;
  const message = [
    `Olá, Ateliê Carô! Quero me inscrever na oficina "${workshop.title}"`,
    `em ${new Date(workshop.date).toLocaleDateString("pt-BR")} (${SITE.address}).`,
    "",
    "Nome: [seu nome]",
  ].join("\n");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {workshop.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={workshop.image} alt={workshop.title} className="h-64 w-full object-cover" />
        )}
        <div className="p-6">
          <h1 className="font-display text-4xl font-bold">{workshop.title}</h1>
          <p className="mt-4 leading-relaxed text-gray-700">{workshop.description}</p>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
            <p>📅 Data: {new Date(workshop.date).toLocaleDateString("pt-BR")}</p>
            <p>⏱ Duração: {workshop.duration} minutos</p>
            <p>📍 Local: {workshop.location}</p>
            <p>👥 Vagas: {spots} restantes de {workshop.maxAttendees}</p>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-2xl font-bold text-magenta">{formatBRL(Number(workshop.price))}</p>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-cobalt px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Inscrever-se pelo WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify render**

Run: `npm run dev`
Open `/oficinas` and `/oficinas/oficina-ceramica-iniciante` — list and detail render with WhatsApp CTA.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add workshops list and detail pages"
```

---

### Task 10: Sobre and Contato pages

**Files:**
- Create: `app/(site)/sobre/page.tsx`, `app/(site)/contato/page.tsx`

**Interfaces:**
- Consumes: `SITE` config.
- Produces: static "Sobre" (story + high-temp process) and "Contato" (contact details + Instagram + hours) pages.

- [ ] **Step 1: Write Sobre page**

```tsx
// app/(site)/sobre/page.tsx
export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Sobre o Ateliê</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-gray-700">
        <p>
          O Ateliê Carô nasce da paixão pela cerâmica artesanal. Cada peça é
          moldada à mão, esmaltada com cuidado e queimada em alta temperatura
          para garantir resistência e beleza duradoura.
        </p>
        <p>
          Acreditamos no processo: no toque do barro, nas texturas, nos tons
          terrosos. Nossas peças são únicas, com pequenas variações que
          contam a história de quem as criou.
        </p>
        <h2 className="pt-4 font-display text-2xl font-bold">Alta Temperatura</h2>
        <p>
          Todas as peças passam por queima em alta temperatura, o que garante
          peças mais resistentes, vitrificadas e seguras para uso no dia a dia.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write Contato page**

```tsx
// app/(site)/contato/page.tsx
import Link from "next/link";
import { SITE } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp";

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold">Contato</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">WhatsApp</h3>
          <p className="mt-2 text-sm">{SITE.whatsapp}</p>
          <a href={whatsappLink("Olá, Ateliê Carô!")} target="_blank" rel="noreferrer"
            className="mt-4 inline-block rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white">
            Falar com a gente
          </a>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Instagram</h3>
          <p className="mt-2 text-sm">{SITE.instagram}</p>
          <a href={SITE.instagram} target="_blank" rel="noreferrer"
            className="mt-4 inline-block rounded bg-cobalt px-4 py-2 text-sm font-semibold text-white">
            Seguir no Instagram
          </a>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Endereço</h3>
          <p className="mt-2 text-sm">{SITE.address}</p>
        </div>
        <div className="rounded-lg bg-blush p-6">
          <h3 className="font-semibold">Horários</h3>
          <p className="mt-2 text-sm">{SITE.hours}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify render**

Run: `npm run dev`
Open `/sobre` and `/contato` — both render with brand styling and correct contact data.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add sobre and contato pages"
```

---

### Task 11: Admin auth (login + session)

**Files:**
- Create: `lib/session.ts`, `app/(admin)/admin/login/page.tsx`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `ADMIN_PASSWORD` env; `bcryptjs`; `iron-session`.
- Produces: `getSession()` server helper, `login`/`logout` API routes, `middleware.ts` protecting `/admin/*` (except `/admin/login`).

- [ ] **Step 1: Write session lib**

```ts
// lib/session.ts
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

type SessionData = { isAdmin: boolean };

export async function getSession() {
  return getIronSession<SessionData>(cookies(), {
    password: process.env.ADMIN_PASSWORD || "change-me-please-32chars-min",
    cookieName: "atelie-caro-admin",
  });
}

export async function isAdmin() {
  const session = await getSession();
  return !!session.isAdmin;
}
```

- [ ] **Step 2: Write login API route**

```ts
// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  const { password } = await req.json();
  const session = await getSession();
  if (password === process.env.ADMIN_PASSWORD) {
    session.isAdmin = true;
    await session.save();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
```

- [ ] **Step 3: Write logout API route**

```ts
// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write login page**

```tsx
// app/(admin)/admin/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Senha incorreta");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="font-display text-2xl font-bold text-center">Admin</h1>
        <input type="password" placeholder="Senha" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-6 w-full rounded border border-gray-300 px-3 py-2" />
        {error && <p className="mt-2 text-sm text-clay">{error}</p>}
        <button className="mt-4 w-full rounded bg-cobalt py-2 font-semibold text-white">Entrar</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Write middleware protecting /admin**

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const COOKIE = "atelie-caro-admin";
const PASSWORD = process.env.ADMIN_PASSWORD || "change-me-please-32chars-min";

export async function middleware(req: Request) {
  const res = NextResponse.next();
  const session = await getIronSession(cookies(), {
    password: PASSWORD,
    cookieName: COOKIE,
  });
  const url = new URL(req.url);
  const isLogin = url.pathname.startsWith("/admin/login");
  if (!session.isAdmin && !isLogin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

> Note: `getIronSession` with `cookies()` in middleware may be limited; if it errors at runtime, replace the middleware with a check inside each admin layout via `isAdmin()`. The admin layout in Task 12 will also re-check auth server-side.

- [ ] **Step 6: Verify login flow**

Run: `npm run dev`
Visit `/admin/login`, enter wrong password (error shown), enter correct `ADMIN_PASSWORD` (redirects to `/admin`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add admin authentication with session cookie"
```

---

### Task 12: Admin layout, dashboard and nav

**Files:**
- Create: `app/(admin)/admin/layout.tsx`, `app/(admin)/admin/page.tsx`, `components/admin/AdminNav.tsx`

**Interfaces:**
- Consumes: `isAdmin()` from Task 11, `prisma`.
- Produces: protected admin shell with nav (Dashboard, Produtos, Oficinas, Encomendas, Pedidos, Sair) and dashboard with counts.

- [ ] **Step 1: Write AdminNav**

```tsx
// components/admin/AdminNav.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/oficinas", label: "Oficinas" },
  { href: "/admin/encomendas", label: "Encomendas" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminNav() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-4">
      <Link href="/admin" className="font-display text-xl font-bold">Ateliê Carô Admin</Link>
      <div className="flex flex-1 gap-4">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-cobalt">
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-sm text-clay">Sair</button>
    </nav>
  );
}
```

- [ ] **Step 2: Write admin layout (server-side auth guard)**

```tsx
// app/(admin)/admin/layout.tsx
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write dashboard page**

```tsx
// app/(admin)/admin/page.tsx
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders, customOrders, workshops] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.customOrder.count({ where: { status: "nova" } }),
    prisma.workshop.count({ where: { active: true } }),
  ]);

  const stats = [
    { label: "Produtos", value: products },
    { label: "Pedidos", value: orders },
    { label: "Encomendas novas", value: customOrders },
    { label: "Oficinas ativas", value: workshops },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-white p-6 shadow">
            <p className="text-3xl font-bold text-cobalt">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify admin flow**

Run: `npm run dev`
Login, land on `/admin` dashboard showing counts.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin layout, nav and dashboard"
```

---

### Task 13: Admin Produtos CRUD with image upload

**Files:**
- Create: `app/(admin)/admin/produtos/page.tsx`, `app/(admin)/admin/produtos/novo/page.tsx`, `app/(admin)/admin/produtos/[id]/editar/page.tsx`
- Create: `app/api/admin/produtos/route.ts`, `app/api/admin/produtos/[id]/route.ts`, `app/api/admin/upload/route.ts`
- Create: `components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: `isAdmin`-protected layout, `prisma`.
- Produces: full CRUD for products including image upload to `public/uploads`.

- [ ] **Step 1: Write upload API route**

```ts
// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ ok: false }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write ProductForm (client)**

```tsx
// components/admin/ProductForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial?: any;
  productId?: string;
};

export default function ProductForm({ initial, productId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    price: initial ? String(initial.price) : "",
    category: initial?.category || "utensilios",
    stock: initial ? String(initial.stock) : "1",
    featured: initial?.featured || false,
    available: initial?.available ?? true,
  });
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [uploading, setUploading] = useState(false);

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) setImages((prev) => [...prev, data.url]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = productId ? `/api/admin/produtos/${productId}` : "/api/admin/produtos";
    const res = await fetch(url, {
      method: productId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock), images }),
    });
    if (res.ok) router.push("/admin/produtos");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <input className="rounded border px-3 py-2" placeholder="Nome" value={form.name}
        onChange={(e) => set("name", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Slug (ex: xicara-azul)" value={form.slug}
        onChange={(e) => set("slug", e.target.value)} required />
      <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Descrição"
        value={form.description} onChange={(e) => set("description", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" step="0.01" placeholder="Preço" value={form.price}
        onChange={(e) => set("price", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" placeholder="Estoque" value={form.stock}
        onChange={(e) => set("stock", e.target.value)} />
      <select className="rounded border px-3 py-2" value={form.category}
        onChange={(e) => set("category", e.target.value)}>
        <option value="utensilios">Utensílios</option>
        <option value="decoracao">Decoração</option>
        <option value="vasos">Vasos</option>
      </select>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)} /> Destaque</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.available}
          onChange={(e) => set("available", e.target.checked)} /> Disponível</label>
      </div>
      <div className="md:col-span-2">
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        {uploading && <p className="text-sm text-gray-500">Enviando...</p>}
        {images.length > 0 && (
          <div className="mt-2 flex gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} className="h-16 w-16 rounded object-cover" alt="" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 rounded-full bg-clay px-1 text-white">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar produto</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Write produtos API routes**

```ts
// app/api/admin/produtos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({ data: body });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

```ts
// app/api/admin/produtos/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const product = await prisma.product.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 4: Write produtos list page**

```tsx
// app/(admin)/admin/produtos/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded bg-cobalt px-4 py-2 font-semibold text-white">
          + Novo produto
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Preço</th><th className="px-4 py-2">Estoque</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">R$ {Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-2">{p.stock}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/produtos/${p.id}/editar`} className="text-cobalt">Editar</Link>
                  <DeleteButton kind="produtos" id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write DeleteButton (client)**

```tsx
// components/admin/DeleteButton.tsx
"use client";
import { useRouter } from "next/navigation";

export default function DeleteButton({ kind, id }: { kind: string; id: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm("Excluir este item?")) return;
    await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={del} className="text-clay">Excluir</button>;
}
```

- [ ] **Step 6: Write new + edit pages**

```tsx
// app/(admin)/admin/produtos/novo/page.tsx
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Novo produto</h1>
      <ProductForm />
    </div>
  );
}
```

```tsx
// app/(admin)/admin/produtos/[id]/editar/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Editar produto</h1>
      <ProductForm initial={product} productId={product.id} />
    </div>
  );
}
```

- [ ] **Step 7: Verify CRUD**

Run: `npm run dev`
Create a product with image upload, edit it, delete it. Check `/produtos` reflects changes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add admin products CRUD with image upload"
```

---

### Task 14: Admin Oficinas CRUD

**Files:**
- Create: `app/(admin)/admin/oficinas/page.tsx`, `app/(admin)/admin/oficinas/novo/page.tsx`, `app/(admin)/admin/oficinas/[id]/editar/page.tsx`
- Create: `app/api/admin/oficinas/route.ts`, `app/api/admin/oficinas/[id]/route.ts`
- Create: `components/admin/WorkshopForm.tsx`

**Interfaces:**
- Consumes: admin layout, `prisma`.
- Produces: full CRUD for workshops.

- [ ] **Step 1: Write WorkshopForm (client)**

```tsx
// components/admin/WorkshopForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initial?: any; workshopId?: string };

export default function WorkshopForm({ initial, workshopId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    date: initial ? new Date(initial.date).toISOString().slice(0, 16) : "",
    duration: initial ? String(initial.duration) : "180",
    price: initial ? String(initial.price) : "",
    location: initial?.location || "",
    maxAttendees: initial ? String(initial.maxAttendees) : "8",
    spotsTaken: initial ? String(initial.spotsTaken) : "0",
    image: initial?.image || "",
    active: initial?.active ?? true,
  });

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = workshopId ? `/api/admin/oficinas/${workshopId}` : "/api/admin/oficinas";
    const res = await fetch(url, {
      method: workshopId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        duration: parseInt(form.duration),
        price: parseFloat(form.price),
        maxAttendees: parseInt(form.maxAttendees),
        spotsTaken: parseInt(form.spotsTaken),
      }),
    });
    if (res.ok) router.push("/admin/oficinas");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2">
      <input className="rounded border px-3 py-2" placeholder="Título" value={form.title}
        onChange={(e) => set("title", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Slug" value={form.slug}
        onChange={(e) => set("slug", e.target.value)} required />
      <textarea className="rounded border px-3 py-2 md:col-span-2" rows={3} placeholder="Descrição"
        value={form.description} onChange={(e) => set("description", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="datetime-local" value={form.date}
        onChange={(e) => set("date", e.target.value)} required />
      <input className="rounded border px-3 py-2" type="number" placeholder="Duração (min)" value={form.duration}
        onChange={(e) => set("duration", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" step="0.01" placeholder="Preço" value={form.price}
        onChange={(e) => set("price", e.target.value)} required />
      <input className="rounded border px-3 py-2" placeholder="Local" value={form.location}
        onChange={(e) => set("location", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" placeholder="Vagas máximas" value={form.maxAttendees}
        onChange={(e) => set("maxAttendees", e.target.value)} />
      <input className="rounded border px-3 py-2" type="number" placeholder="Vagas ocupadas" value={form.spotsTaken}
        onChange={(e) => set("spotsTaken", e.target.value)} />
      <input className="rounded border px-3 py-2 md:col-span-2" placeholder="URL da imagem" value={form.image}
        onChange={(e) => set("image", e.target.value)} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.active}
        onChange={(e) => set("active", e.target.checked)} /> Ativa</label>
      <div className="md:col-span-2">
        <button className="rounded bg-cobalt px-6 py-2 font-semibold text-white">Salvar oficina</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write oficinas API routes**

```ts
// app/api/admin/oficinas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workshop = await prisma.workshop.create({ data: body });
    return NextResponse.json({ ok: true, workshop }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

```ts
// app/api/admin/oficinas/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const workshop = await prisma.workshop.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ ok: true, workshop });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.workshop.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 3: Write oficinas list + new + edit pages**

```tsx
// app/(admin)/admin/oficinas/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminOficinasPage() {
  const workshops = await prisma.workshop.findMany({ orderBy: { date: "asc" } });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Oficinas</h1>
        <Link href="/admin/oficinas/novo" className="rounded bg-cobalt px-4 py-2 font-semibold text-white">
          + Nova oficina
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-2">Título</th><th className="px-4 py-2">Data</th><th className="px-4 py-2">Vagas</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {workshops.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-2">{w.title}</td>
                <td className="px-4 py-2">{new Date(w.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">{w.spotsTaken}/{w.maxAttendees}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Link href={`/admin/oficinas/${w.id}/editar`} className="text-cobalt">Editar</Link>
                  <DeleteButton kind="oficinas" id={w.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

```tsx
// app/(admin)/admin/oficinas/novo/page.tsx
import WorkshopForm from "@/components/admin/WorkshopForm";

export default function NewWorkshopPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Nova oficina</h1>
      <WorkshopForm />
    </div>
  );
}
```

```tsx
// app/(admin)/admin/oficinas/[id]/editar/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkshopForm from "@/components/admin/WorkshopForm";

export const dynamic = "force-dynamic";

export default async function EditWorkshopPage({ params }: { params: { id: string } }) {
  const workshop = await prisma.workshop.findUnique({ where: { id: params.id } });
  if (!workshop) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Editar oficina</h1>
      <WorkshopForm initial={workshop} workshopId={workshop.id} />
    </div>
  );
}
```

- [ ] **Step 4: Verify CRUD**

Run: `npm run dev`
Create, edit, delete a workshop. Confirm changes reflect on `/oficinas`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin workshops CRUD"
```

---

### Task 15: Admin Encomendas and Pedidos lists

**Files:**
- Create: `app/(admin)/admin/encomendas/page.tsx`, `app/(admin)/admin/pedidos/page.tsx`
- Create: `app/api/admin/encomendas/[id]/route.ts`

**Interfaces:**
- Consumes: admin layout, `prisma`.
- Produces: read/manage custom orders (status update) and cart orders (list with items + total).

- [ ] **Step 1: Write encomendas status API**

```ts
// app/api/admin/encomendas/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const order = await prisma.customOrder.update({ where: { id: params.id }, data: { status } });
    return NextResponse.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
```

- [ ] **Step 2: Write encomendas page with status selector**

```tsx
// app/(admin)/admin/encomendas/page.tsx
"use client";
import { useEffect, useState } from "react";

type Encomenda = {
  id: string;
  name: string;
  contact: string;
  description: string;
  status: string;
  createdAt: string;
};

const STATUSES = ["nova", "em_orcamento", "confirmada", "cancelada"];

export default function AdminEncomendasPage() {
  const [orders, setOrders] = useState<Encomenda[]>([]);

  useEffect(() => {
    fetch("/api/encomendas").then(async (r) => setOrders(await r.json())).catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/encomendas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Encomendas</h1>
      <div className="mt-6 space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{o.name}</p>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-500">{o.contact}</p>
            <p className="mt-2 text-sm">{o.description}</p>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">Nenhuma encomenda.</p>}
      </div>
    </div>
  );
}
```

> Note: this page requires a `GET /api/encomendas` listing endpoint. Add it to `app/api/encomendas/route.ts`:
```ts
export async function GET() {
  const orders = await prisma.customOrder.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}
```

- [ ] **Step 3: Write pedidos page (server)**

```tsx
// app/(admin)/admin/pedidos/page.tsx
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/cart";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <div className="mt-6 space-y-4">
        {orders.map((o) => {
          const items = (o.items as any[]) || [];
          return (
            <div key={o.id} className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{o.name} <span className="text-gray-500">({o.contact})</span></p>
                <p className="font-bold text-magenta">{formatBRL(Number(o.total))}</p>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {items.map((it, i) => (
                  <li key={i}>• {it.name} — {it.qty}x — {formatBRL(Number(it.unitPrice) * it.qty)}</li>
                ))}
              </ul>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-gray-500">Nenhum pedido.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify admin lists**

Run: `npm run dev`
Place an order (via `/carrinho`) and submit an encomenda; confirm both appear and encomenda status updates persist.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add admin encomendas and pedidos lists"
```

---

### Task 16: README, polish and final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: project documentation and final build/test verification.

- [ ] **Step 1: Write README**

```markdown
# Ateliê Carô — E-commerce

E-commerce para o Ateliê Carô (cerâmica artesanal): vitrine de produtos,
encomendas personalizadas e oficinas, com pedidos via WhatsApp e painel admin.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite

## Configuração

1. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD`, `NEXT_PUBLIC_WHATSAPP`, etc.
2. Instale e prepare o banco:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   ```
3. Rode:
   ```bash
   npm run dev
   ```

## Áreas
- Vitrine pública: `/`, `/produtos`, `/encomendas`, `/oficinas`, `/sobre`, `/contato`, `/carrinho`
- Admin: `/admin/login` (senha em `ADMIN_PASSWORD`)
- Uploads: `public/uploads/`
```

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: production build completes with no errors.

- [ ] **Step 3: Run full test suite**

Run: `npx jest`
Expected: all tests pass (config, whatsapp, orders).

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`
Walk through: home → products → add to cart → cart → WhatsApp checkout; admin login → create product with upload; encomenda form → WhatsApp + recorded.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add README and final verification"
```

---

## Self-Review

**Spec coverage check:**
- §2 Stack/architecture → Task 1, 2
- §3 Design system → Task 1 (tailwind tokens + fonts), throughout components
- §4 Data models → Task 1 (schema)
- §5 Cart→WhatsApp flow → Task 3, 7
- §6 Vitrine pages (home, catálogo, produto, carrinho, encomendas, oficinas, sobre, contato) → Tasks 5, 6, 7, 8, 9, 10
- §7 Admin (login, dashboard, produtos, oficinas, encomendas, pedidos) → Tasks 11, 12, 13, 14, 15
- §8 Out of scope → not implemented

**Potential ambiguity addressed inline:** the encomendas admin page requires a `GET /api/encomendas` endpoint, which is added inline in Task 15 Step 2 to keep the plan self-consistent.
