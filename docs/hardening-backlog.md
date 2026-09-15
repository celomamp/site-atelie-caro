# Hardening — backlog

Auditoria do codebase do Ateliê Carô feita em 2026-09-14. Itens **1–8 concluídos**;
**9–23 pendentes** para as próximas sessões.

Referência: `README.md`, `middleware.ts`, `lib/`, `app/api/`, `prisma/schema.prisma`.

## Concluído nesta sessão

### 1. Bypass de login quando `ADMIN_PASSWORD` ausente (CONCLUÍDO)
- Problema: `app/api/admin/login/route.ts` comparava `password === process.env.ADMIN_PASSWORD`.
  Com a env ausente, `undefined === undefined` aprovava o login com corpo `{}`.
- Solução:
  - `lib/admin-auth.ts` — `verifyAdminPassword()` recusa entrada/segredo vazios,
    não-string ou de tamanhos diferentes, e usa `crypto.timingSafeEqual`.
  - Rota valida a env no início e responde `500` (com log) se não configurada.
- Testes: `lib/__tests__/admin-auth.test.ts` (5 casos).

### 2. CVEs do Next.js 14.2.35 (MITIGADO — upgrade pendente)
- Contexto: `npm audit` reporta 1 critical / 7 high; a correção disponível é
  `next@16.3.5` (major), que exige React 19 e migrar `cookies()`, `params` e
  `searchParams` para async. Upgrade documentado como tarefa separada (ver #2 em
  Pendentes).
- Mitigação aplicada em `next.config.mjs`:
  - `images.unoptimized: true` — desliga o otimizador nativo (`/_next/image`),
    que concentra CVEs de RCE/DoS. O site usa `<img>` e os logos via
    `next/image`, sem perda funcional.
  - `poweredByHeader: false`.
- Sem testes (arquivo de configuração).

### 4. Webhook MP fail-open em produção (CONCLUÍDO)
- Problema: `app/api/mercadopago/webhook/route.ts` só validava a assinatura se
  `MERCADO_PAGO_WEBHOOK_SECRET` existisse; em produção, sem a env, aceitava a
  notificação sem validação.
- Solução:
  - `resolveWebhookSecretPolicy(secret, nodeEnv)` em `lib/mercadopago.ts`:
    `validate` | `allow-unvalidated` (fora de produção) | `reject` (produção sem
    secret).
  - A rota responde `500` e loga quando a política é `reject`.
- Testes: bloco `resolveWebhookSecretPolicy` em `lib/__tests__/mercadopago.test.ts`.

### 3. Rate limit distribuído + endpoints públicos (CONCLUÍDO)
- Problema: o limiter em memória (`Map`) não era compartilhado entre instâncias
  serverless e crescia sem limite; vários endpoints públicos não tinham limite.
- Solução:
  - Modelo `RateLimit` (`prisma/schema.prisma`) + migration
    `prisma/migrations/20260917000000_rate_limit/`.
  - `lib/ratelimit.ts`: `hit()` agora é assíncrono (janela fixa, chave
    `` `${key}:${windowStart}` ``, incremento atômico via `upsert`, limpeza
    best-effort de linhas expiradas) e novo `clientIp(req)`.
  - Limites aplicados: login (5/10min), upload de encomenda (10/10min),
    `POST /api/orders` (20/10min), `POST /api/encomendas` (10/10min),
    `POST /api/checkout/mercadopago` (10/10min),
    `POST /api/shipping/quote` (30/10min).
- Testes: `lib/__tests__/ratelimit.test.ts` (fake do boundary Prisma).
- **Pendente de operação**: aplicar a migration no banco (`prisma migrate deploy`
  em produção; `npx prisma migrate deploy` ou `npx prisma db push` no local).
  O `vercel-build` já roda `prisma migrate deploy` em produção.

## Concluído na sessão 2

### 5. Autorização só no middleware (CONCLUÍDO)
- `lib/admin-guard.ts` — `requireAdmin()` revalida a sessão (`isAdmin()`) em cada
  handler e responde `401`; chamado em todos os handlers de `app/api/admin/**`
  (login é a única exceção, é o endpoint de autenticação).
- Testes: `lib/__tests__/admin-guard.test.ts`.

### 6. Mass assignment nas rotas admin (CONCLUÍDO)
- `lib/admin-schemas.ts` — schemas Zod com whitelist explícita de campos
  (`productCreateSchema`/`productUpdateSchema`, `workshopCreateSchema`/`...Update`,
  `categorySchema`, `encomendaStatusSchema`). O Zod remove chaves desconhecidas,
  então os handlers nunca fazem spread do corpo bruto no Prisma.
- Rotas de produtos, oficinas, categorias e o `PUT` de encomenda passaram a
  validar com `.safeParse()` e montar o objeto do Prisma campo a campo.
- Dependência `zod` adicionada.
- Testes: `lib/__tests__/admin-schemas.test.ts`,
  `app/api/admin/produtos/route.test.ts`.

### 7. Security headers (CONCLUÍDO)
- `next.config.mjs` — `async headers()` aplica em `/:path*`:
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy (camera/microphone/geolocation)` e
  `Content-Security-Policy-Report-Only` (não bloqueia; vira enforce no upgrade
  do Next, quando houver nonce para os scripts inline).
- Verificado com `npm start` + `curl -I` (headers presentes, `X-Powered-By`
  ausente).

### 8. CSRF nas mutações do admin (CONCLUÍDO)
- `lib/admin-guard.ts` — `isSameOriginRequest()`/`requireSameOrigin()`:
  em produção exige `Sec-Fetch-Site: same-origin|none`, senão compara
  `Origin` com `Host`; falha com `403`. Fora de produção libera (testes/CLI).
- `guardAdminMutation()` combina sessão + origem e é usado em todos os
  `POST`/`PUT`/`DELETE` do admin (inclui upload e logout). O login também valida
  a origem.
- Testes: `lib/__tests__/admin-guard.test.ts`.

## Pendentes

### 9. `x-forwarded-for` spoofável (MÉDIO)
`lib/ratelimit.ts:clientIp` usa a primeira entrada do header, que pode ser
forjada fora de um proxy confiável. Na Vercel o header é sobrescrito; endurecer
para usar a entrada do proxy confiável (ex.: última) ou validar origem.

### 10. Bucket público compartilhado para uploads de clientes (MÉDIO)
`app/api/encomendas/upload/route.ts` grava no mesmo bucket público `produtos`.
- Separar em bucket privado + URLs assinadas, ou expirar/limpar imagens de
  encomenda.

### 11. Content-Type confiado do cliente no upload (MÉDIO)
`file.type` é repassado ao Storage (`app/api/admin/upload`, `app/api/encomendas/upload`).
- Derivar o content-type do magic byte validado, não do cliente.

### 12. IDOR leve no retorno do checkout (MÉDIO)
`app/(site)/checkout/retorno/page.tsx:27` busca o pedido por
`external_reference` da URL e consulta a API do MP com `payment_id` arbitrário.
cuid mitiga, mas vale não exibir dados sem validação de origem/sessão.

### 13. Total e frete vindos do client no fluxo WhatsApp (MÉDIO)
`app/api/orders/route.ts:9,37-65` grava `unitPrice` e frete enviados pelo
navegador. Recalcular server-side a partir do banco (como no checkout MP).

### 14. Validação de entrada estruturada (MÉDIO)
Checagens manuais e vários `any`. Padronizar Zod por rota.

### 15. Limite de tamanho de corpo JSON (MÉDIO)
Rotas não limitam o payload. Adicionar checagem de `Content-Length`/tamanho.

### 16. Cookie de sessão e session fixation (MÉDIO)
- Declarar `cookieOptions` explicitamente (`httpOnly`, `secure`, `sameSite`).
- Regenerar a sessão no login (`lib/session.ts`, `app/api/admin/login/route.ts`).

### 17. `next/image` sem `remotePatterns` (MÉDIO)
Hoje só logos locais. Ao usar imagens remotas, configurar `remotePatterns`
restritivo (há CVE de SSRF no otimizador). Rever junto do upgrade (#2).

### 18. `coverage/` fora do `.gitignore` (BAIXO)
Aparece como untracked. Adicionar `coverage/` ao `.gitignore` e remover.

### 19. Fallback de `SESSION_SECRET` de dev (BAIXO)
`lib/session-config.ts:8`. Garantir que builds de produção nunca caiam nele
(já lança erro em produção sem a env).

### 20. Dependências de dev vulneráveis (BAIXO)
`eslint-config-next`→glob/minimatch, `tsx`→esbuild, `iron-session`→cookie.
Atualizar em conjunto com o upgrade (#2).

### 21. URL de imagem arbitrária em oficinas (BAIXO)
`components/admin/WorkshopForm.tsx` aceita qualquer URL em `image`. Validar
domínio/permitir só storage próprio.

### 22. `STORAGE_DRIVER=local` em produção (BAIXO)
`lib/storage.ts`. Garantir que produção use Supabase.

### 23. Observabilidade/auditoria do admin (BAIXO)
Sem registro de acessos/ações; `console.error` pode vazar dados. Adicionar log
estruturado sem PII.

## Tarefa separada: upgrade Next.js (item 2)

Migrar `next@14.2.35` → `next@16.x` + `react@19`:
- `cookies()`, `headers()`, `params` e `searchParams` passam a ser assíncronos
  (`lib/session.ts`, layouts/páginas e route handlers dinâmicos).
- Revalidar middleware (`middleware.ts`), `next/image` e o pipeline da Vercel
  (`scripts/vercel-build.sh`).
- Depois do upgrade, reavaliar `images.unoptimized` e os headers (#7).

## Verificação da sessão 1 (itens 1–4)
- `npx jest` → 22 suites, 165 testes passando.
- `npm run lint` → sem warnings/erros.
- `npx tsc --noEmit` → sem erros.
- `npm run build` → sucesso.
- `npx prisma validate` → schema válido.

## Verificação da sessão 2 (itens 5–8)
- `npx jest` → 25 suites, 188 testes passando.
- `npm run lint` → sem warnings/erros.
- `npx tsc --noEmit` → sem erros.
- `npm run build` → sucesso.
- `npm start` + `curl -I` → headers presentes; `POST /api/admin/produtos`
  sem sessão retorna `401`.

> Falta rodar a migration do rate limit no banco antes do deploy (item 3).
