# Ateliê Carô — E-commerce

E-commerce para o Ateliê Carô (cerâmica artesanal): vitrine de produtos,
encomendas personalizadas e oficinas, com pedidos via WhatsApp e painel admin.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · Supabase (Postgres)

## Configuração

1. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD`, `NEXT_PUBLIC_WHATSAPP`, `SESSION_SECRET`, etc. Use valores próprios — especialmente `SESSION_SECRET` (obrigatório em produção) e `ADMIN_PASSWORD`.
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

## Deploy na Vercel

1. Importe o repositório na Vercel (framework: Next.js, sem build overrides).
2. No Supabase, crie um bucket **público** de Storage chamado `produtos`
   (Storage → New bucket → name: `produtos` → marque **Public bucket**).
   Sem esse bucket, os uploads de fotos pelo painel admin retornam 500.
3. Configure as env vars de produção:

| Env var | Como obter |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection Pooling (porta **6543**), com `?pgbouncer=true&connection_limit=1` — **não** usar a URL direta 5432 |
| `ADMIN_PASSWORD` | senha forte do painel admin |
| `SESSION_SECRET` | `openssl rand -base64 32` (obrigatório, 32+ caracteres) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Supabase → Settings → API (service role) |
| `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_HOURS`, `NEXT_PUBLIC_SITE_NAME` | config pública do site (prefix NEXT_PUBLIC é inlined no build — configure antes do primeiro deploy) |

> Configure o runtime Node.js do projeto de produção na Vercel para **Node 22**:
> a dependência `@supabase/supabase-js@2.116.0` declara `engines.node >=22`.

4. Aplique migrations (uma vez, da sua máquina, com a URL direta 5432):
   `npx prisma migrate deploy`
5. Cadastre conteúdo (produtos/oficinas e fotos) pelo painel `/admin/login`.

## Áreas

- Vitrine pública: `/`, `/produtos`, `/encomendas`, `/oficinas`, `/sobre`, `/contato`, `/carrinho`
- Admin: `/admin/login` (senha em `ADMIN_PASSWORD`)
- Uploads: armazenados no Supabase Storage (bucket público `produtos`)
