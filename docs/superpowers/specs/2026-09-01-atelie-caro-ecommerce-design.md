# Ateliê Carô — E-commerce de Cerâmica Artesanal (Design Spec)

**Data:** 2026-09-01
**Status:** Aprovado

## 1. Visão Geral

E-commerce para o **Ateliê Carô**, ateliê de cerâmica de alta temperatura com peças artesanais. O site deve ser agradável, responsivo, com design de interface arrojado e alinhado à identidade da marca, vendendo três tipos de oferta:

1. **Peças padronizadas** — catálogo com preço, foto e estoque, vendidas via carrinho → pedido por WhatsApp.
2. **Encomendas personalizadas** — cliente descreve a peça e pede orçamento via WhatsApp.
3. **Oficinas de cerâmica** — inscrição/contato via WhatsApp.

## 2. Stack e Arquitetura

- **Next.js 14+ (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite.**
- **App Router** para SEO forte nas páginas de produto/oficina.
- **SQLite** como banco local (arquivo), migração futura possível para Postgres.
- **Autenticação do admin** via senha única (`ADMIN_PASSWORD` em `.env`) com sessão/cookie.
- **Carrinho** em estado cliente (localStorage), gerando mensagem formatada para o WhatsApp.
- **Upload de imagens** direto para `public/uploads` no painel admin.
- **Dados de contato** centralizados em `.env` (WhatsApp, Instagram, endereço, horários).

### Estrutura de diretórios

```
atelie-caro/
├── app/
│   ├── (site)/                    # vitrine pública
│   │   ├── page.tsx               # home
│   │   ├── produtos/page.tsx      # catálogo (filtro por categoria)
│   │   ├── produtos/[slug]/page.tsx
│   │   ├── encomendas/page.tsx
│   │   ├── oficinas/page.tsx
│   │   ├── oficinas/[slug]/page.tsx
│   │   ├── sobre/page.tsx
│   │   └── contato/page.tsx
│   ├── carrinho/page.tsx
│   ├── (admin)/                   # painel protegido
│   │   ├── login/page.tsx
│   │   └── admin/{dashboard, produtos, oficinas, encomendas, pedidos}/...
│   └── api/                       # rotas de servidor para o admin
├── components/
├── lib/ (prisma, utils, whatsapp)
├── prisma/ (schema + sqlite)
└── public/uploads/                # imagens das peças
```

## 3. Sistema de Design

As cores **Azul Cobalto** e **Rosa Magenta** são as protagonistas da marca, usadas com força em títulos, botões, blocos e destaques. Os tons terrosos e o off-white servem como base neutra e textura, em segundo plano.

### Paleta

| Token       | Cor       | Uso                                            |
|-------------|-----------|------------------------------------------------|
| `cobalt`    | `#1B4FD8` | Títulos, botões primários, blocos/faixas, nav  |
| `magenta`   | `#E8197B` | CTA secundários, highlights, badges, hover      |
| `terracotta`| `#C66A46` | Acentos, texturas, vínculo com barro/argila     |
| `clay`      | `#A8573C` | Detalhes, linhas                                |
| `cream`     | `#FAF6F0` | Fundo neutro                                     |
| `blush`     | `#F6E7EF` | Cartões, sobreposições suaves                    |
| `ink`       | `#2B2430` | Texto de corpo                                   |

### Tipografia

- **Títulos:** `Playfair Display` (personalidade + refino); detalhes cursivos sutis via `Pacifico`.
- **Corpo/UI:** `Montserrat` (alta legibilidade no mobile).

### Linguagem visual

- Blocos cobalto sólido com cantos levemente arredondados (herança do template do guia).
- Magenta em ícones de traço fino, badges, preço e estados de ação.
- Texturas de argila/terracota (gradientes sutis ou ruído) evocando o barro.
- Tipografia grande em títulos com sobreposição de cores (palavra-chave em magenta sobre fundo cobalto).
- Fotos das peças em destaque sobre fundo cream, com respiro, valorizando o artesanal.

## 4. Modelos de Dados (Prisma)

```prisma
model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  price       Decimal
  category    String
  images      String[]         // paths relativos a /uploads
  stock       Int      @default(1)
  featured    Boolean  @default(false)
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Workshop {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  date        DateTime
  duration    Int
  price       Decimal
  location    String
  maxAttendees Int
  spotsTaken  Int      @default(0)
  image       String?
  active      Boolean  @default(true)
}

model CustomOrder {
  id          String   @id @default(cuid())
  name        String
  contact     String
  description String
  status      String   @default("nova")   // nova | em_orcamento | confirmada | cancelada
  createdAt   DateTime @default(now())
}

model Order {
  id          String   @id @default(cuid())
  name        String
  contact     String
  items       Json                      // [{slug, name, qty, unitPrice}]
  total       Decimal
  status      String   @default("recebido")
  createdAt   DateTime @default(now())
}
```

## 5. Fluxo de Carrinho → Pedido via WhatsApp

1. Cliente adiciona peças ao carrinho (estado cliente, persistido em localStorage).
2. No carrinho, edita quantidades/remove, vê o total e clica em **"Enviar pedido pelo WhatsApp"**.
3. Monta mensagem formatada e abre `https://wa.me/<num>?text=<encoded>`:

```
Olá, Ateliê Carô! Gostaria de fazer um pedido:

• Xícara de Cerâmica — 2x — R$ 180,00
• Vaso Terracota — 1x — R$ 95,00

Total: R$ 275,00

Nome: [nome]
```

4. Opcionalmente grava o pedido via `POST /api/orders` (histórico no admin).
5. Encomendas e Oficinas usam formulários próprios que também montam mensagem WhatsApp.
6. Número de WhatsApp e mensagens padrão são configuráveis via `.env` + constantes.

## 6. Páginas da Vitrine

1. **Home** — hero com título grande (palavra-chave magenta sobre fundo cobalto), grid de categorias, destaques (`featured`), faixa de oficinas, bloco de encomendas, rodapé cobalto com contato.
2. **Catálogo** (`/produtos`) — grid responsivo com filtro por categoria, ordenação, badge de estoque/esgotado.
3. **Detalhe de produto** (`/produtos/[slug]`) — galeria, descrição, preço em magenta, seletor de quantidade, "Adicionar ao carrinho".
4. **Carrinho** (`/carrinho`) — editar/remover, total, enviar pedido via WhatsApp.
5. **Encomendas** (`/encomendas`) — processo + formulário → mensagem WhatsApp.
6. **Oficinas** (`/oficinas` e `/oficinas/[slug]`) — lista com data/duração/local/vagas/preço + detalhe com CTA.
7. **Sobre / Contato** — história, processo (alta temperatura), contato, Instagram, horários.

**Header** com nav e ícone de carrinho com contador; responsivo com menu hambúrguer.

## 7. Painel Admin

- **Login** — senha via `ADMIN_PASSWORD`.
- **Dashboard** — nº de produtos, pedidos, encomendas novas, próximas oficinas.
- **Produtos** — CRUD com upload de fotos.
- **Oficinas** — CRUD com data/vagas/status.
- **Encomendas** — lista com gestão de status.
- **Pedidos** — lista do carrinho com itens e total.
- **Config** (opcional) — edição de WhatsApp de fallback.

## 8. Fora de Escopo (MVP)

- Gateways de pagamento online (cartão/PIX) — pedido é via WhatsApp.
- Múltiplos usuários admin / RBAC.
- Cálculo automático de frete.
- Catálogo com múltiplas variantes (tamanhos/cores por SKU).