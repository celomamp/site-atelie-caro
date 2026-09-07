# Ateliê Carô — E-commerce

E-commerce para o Ateliê Carô (cerâmica artesanal): vitrine de produtos,
encomendas personalizadas e oficinas, com pagamento via Mercado Pago
(Checkout Pro), pedidos via WhatsApp e painel admin.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · Supabase (Postgres)

## Configuração

1. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD`, `NEXT_PUBLIC_WHATSAPP`, `SESSION_SECRET`, etc. Use valores próprios — especialmente `SESSION_SECRET` (obrigatório em produção) e `ADMIN_PASSWORD`. No ambiente local, `DIRECT_DATABASE_URL` pode ser igual à `DATABASE_URL` (o Prisma CLI a exige para `db push`/migrations).
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

## Checkout Mercado Pago (Checkout Pro)

O carrinho permite pagar online com o [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/overview)
(cartão, Pix, boleto ou conta Mercado Pago) ou enviar o pedido por WhatsApp.

Fluxo:

1. No carrinho, "Pagar com Mercado Pago" chama `POST /api/checkout/mercadopago`,
   que valida itens e estoque **no banco** (o client só envia slug e quantidade),
   cria o pedido e a preferência (`external_reference` = id do pedido) e
   redireciona o comprador para o `init_point` do Mercado Pago.
2. Após o pagamento, o comprador volta para `/checkout/retorno`, que confirma o
   pagamento consultando a API do Mercado Pago (fallback caso o webhook ainda não
   tenha chegado) e limpa o carrinho se aprovado.
3. O webhook `POST /api/mercadopago/webhook` recebe as notificações, valida a
   assinatura `x-signature` e atualiza o pedido. A baixa de estoque acontece uma
   única vez, na transição pendente → aprovado.

Configuração:

1. Em [Suas Integrações](https://www.mercadopago.com.br/developers/panel/app),
   crie uma aplicação e copie o **Access Token** de teste (`TEST-...`) para
   `MERCADO_PAGO_ACCESS_TOKEN`.
2. No painel da aplicação, em **Webhooks**, configure a URL de notificações de
   pagamento como `https://SEU-DOMINIO/api/mercadopago/webhook` e copie a chave
   secreta para `MERCADO_PAGO_WEBHOOK_SECRET`.
3. Defina `NEXT_PUBLIC_APP_URL` com a URL pública (usada nas `back_urls`).
4. Para testar, use os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/integration-test/test-purchases)
   do Mercado Pago (ex.: Mastercard `5031 4332 1540 6351`, nome `APRO`).
5. Para produção, troque o access token pelo de produção e conclua a homologação
   no painel ("Subir em produção").

## Deploy na Vercel

1. Importe o repositório na Vercel (framework: Next.js, sem build overrides).
2. No Supabase, crie um bucket **público** de Storage chamado `produtos`
   (Storage → New bucket → name: `produtos` → marque **Public bucket**).
   Sem esse bucket, os uploads de fotos pelo painel admin retornam 500.
3. Configure as env vars de produção:

| Env var | Como obter |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection Pooling (porta **6543**), com `?pgbouncer=true&connection_limit=1` — **não** usar a URL direta 5432 |
| `DIRECT_DATABASE_URL` | Supabase → Connection Pooling → modo **sessão** (porta **5432**, host `aws-0-<regiao>.pooler.supabase.com`, sem `pgbouncer=true`) — usada pelo Prisma CLI (migrations) |
| `ADMIN_PASSWORD` | senha forte do painel admin |
| `SESSION_SECRET` | `openssl rand -base64 32` (obrigatório, 32+ caracteres) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Supabase → Settings → API (service role) |
| `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_HOURS`, `NEXT_PUBLIC_SITE_NAME` | config pública do site (prefix NEXT_PUBLIC é inlined no build — configure antes do primeiro deploy) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Suas Integrações → Detalhes da aplicação → Credenciais de produção |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Suas Integrações → Webhooks → Chave secreta (valida a assinatura do webhook) |
| `NEXT_PUBLIC_APP_URL` | URL pública do site (ex.: `https://atelie.com`) |

> Configure o runtime Node.js do projeto de produção na Vercel para **Node 22**:
> a dependência `@supabase/supabase-js@2.116.0` declara `engines.node >=22`.

4. Migrations rodam **no pipeline da Vercel**: o script `vercel-build`
   (`scripts/vercel-build.sh`) aplica `prisma migrate deploy` antes do `next build`
   em todo deploy de **produção** (previews pulam as migrations — fail-fast: se a
   migration falhar, o deploy falha). Já aplicadas são puladas (idempotente).
5. Cadastre conteúdo (produtos/oficinas e fotos) pelo painel `/admin/login`.

## Áreas

- Vitrine pública: `/`, `/produtos`, `/encomendas`, `/oficinas`, `/sobre`, `/contato`, `/carrinho`
- Checkout Mercado Pago: retorno do pagamento em `/checkout/retorno`; notificações em `/api/mercadopago/webhook`
- Admin: `/admin/login` (senha em `ADMIN_PASSWORD`)
- Uploads: armazenados no Supabase Storage (bucket público `produtos`)
