# Vercel Deploy Readiness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o projeto apto a deploy na Vercel: corrigir CVE do middleware, migrar upload de fotos para o Supabase Storage, proteger o login admin, versionar o schema Prisma e documentar as env vars de produção.

**Architecture:** O app é Next.js 14 (App Router) com Postgres no Supabase via Prisma. Os centros de upload migram de `public/uploads/` (fs local, efêmero na Vercel) para um bucket público do Supabase Storage; novos uploads gravam e retornam URLs públicas absolutas (fotos antigas ficam sob `/uploads/...` e podem ser recadastradas pelo admin, conforme decisão do dono). O login admin recebe rate limiting em memória por IP.

**Tech Stack:** Next.js 14.2.x, Prisma 5.18 (postgresql), Supabase (@supabase/supabase-js Storage), iron-session 8, Jest/ts-jest.

**Spec:** docs/superpowers/specs/2026-09-01-atelie-caro-ecommerce-design.md (auth por `ADMIN_PASSWORD`; produtos com imagens) + análise de deploy de 2026-09-07 (conversa).

## Global Constraints

- Next.js na linha `14.2.x`,/exatamente `>=14.2.25` (CVE-2025-29927). Não saltar para 15/16 neste plano.
- Nunca commitar `.env` (já ignorado). Nenhum segredo hardcoded no código.
- O client Supabase (server) usa `SUPABASE_SECRET_KEY` (service role) — só em route handlers server-side; nunca expor ao cliente.
- Contrato de resposta do upload preservado: `{ ok: boolean, url?: string }` (o `ProductForm` não muda).
- Buckets/constantes: bucket `produtos`, objeto prefixado em `media/<filename>`; URL pública = `${SUPABASE_URL}/storage/v1/object/public/produtos/media/<filename>`.
- Banco de dados: Supabase Postgres já rodando com o schema aplicado (via `db push`). Baseline do `prisma migrate` deve marcar a migration inicial como aplicada (sem tentar recriar tabelas).
- Testes: Jest (`npm test`), zero mock de rede. Suíte atual: `lib/__tests__/config.test.ts`, `lib/__tests__/whatsapp.test.ts`.
- Commits: conventional commits (o repositório já usa `feat:`, `fix:`, `chore:`).

---

### Task 1: Upgrade de segurança do Next + geração do Prisma Client no build

**Files:**
- Modify: `package.json` (scripts + dependency)

**Interfaces:**
- Consumes: nada.
- Produces: `next@14.2.35`; script `postinstall` que garante `prisma generate` (necessário porque a Vercel roda `npm install` + `npm run build` e o build consome o Prisma Client gerado).

- [ ] **Step 1: Atualizar next e registrar postinstall**

```bash
npm install next@14.2.35
```

Em `package.json`, dentro de `"scripts"`, adicionar:

```json
"postinstall": "prisma generate"
```

- [ ] **Step 2: Verificar versão instalada e clicada do CVE**

Run: `npm ls next`
Expected: `next@14.2.35` (>= 14.2.25 corrige o bypass de middleware CVE-2025-29927).

- [ ] **Step 3: Rodar build e testes**

Run: `npm run build && npm test`
Expected: build exit 0; todos os testes passando.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade next to 14.2.35 (CVE-2025-29927) and generate prisma client on install"
```

---

### Task 2: Rate limiting no login admin (TDD)

**Files:**
- Create: `lib/ratelimit.ts`
- Modify: `app/api/admin/login/route.ts`
- Test: `lib/__tests__/ratelimit.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `hit(key: string, opts?: { limit?: number; windowMs?: number }): { ok: boolean; retryAfter: number }` — `limit` default 5, `windowMs` default 600000 (10 min). `retryAfter` em segundos restantes da janela. Implementação em memória (por instância de lambda — mitiga brute-force na prática; combate a abuso determinístico ficaria num WAF).

- [ ] **Step 1: Escrever o teste falhando** (`lib/__tests__/ratelimit.test.ts`)

```ts
import { resetRatelimit, hit } from "../ratelimit";

const FREE_WINDOW = { limit: 3, windowMs: 1000 };

describe("ratelimit", () => {
  beforeEach(() => resetRatelimit());

  it("allows under the limit and blocks after", () => {
    expect(hit("ip1", FREE_WINDOW).ok).toBe(true);
    expect(hit("ip1", FREE_WINDOW).ok).toBe(true);
    expect(hit("ip1", FREE_WINDOW).ok).toBe(true);
    const blocked = hit("ip1", FREE_WINDOW);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    hit("ip1", FREE_WINDOW);
    hit("ip1", FREE_WINDOW);
    expect(hit("ip2", FREE_WINDOW).ok).toBe(true);
  });

  it("resets after the window expires", async () => {
    hit("k", { limit: 1, windowMs: 30 });
    expect(hit("k", { limit: 1, windowMs: 30 }).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(hit("k", { limit: 1, windowMs: 30 }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar teste para ver falhar**

Run: `npm test -- ratelimit`
Expected: FAIL — módulo `../ratelimit` não existe.

- [ ] **Step 3: Implementar** (`lib/ratelimit.ts`)

```ts
// lib/ratelimit.ts
const attempts = new Map<string, number[]>();

export function hit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): { ok: boolean; retryAfter: number } {
  const limit = opts?.limit ?? 5;
  const windowMs = opts?.windowMs ?? 600000;
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - timestamps[0])) / 1000);
    return { ok: false, retryAfter };
  }
  timestamps.push(now);
  attempts.set(key, timestamps);
  return { ok: true, retryAfter: 0 };
}

export function resetRatelimit() {
  attempts.clear();
}
```

- [ ] **Step 4: Rodar teste para ver passar**

Run: `npm test -- ratelimit`
Expected: PASS (3 testes).

- [ ] **Step 5: Integrar no route de login** — em `app/api/admin/login/route.ts`, importar `hit` e aplicar antes da verificação de senha:

```ts
import { hit } from "@/lib/ratelimit";

// dentro de POST, antes de session/getSession:
const ip =
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const rl = hit(`login:${ip}`);
if (!rl.ok) {
  return NextResponse.json(
    { ok: false, retryAfter: rl.retryAfter },
    { status: 429 },
  );
}
```

- [ ] **Step 6: Teste manual do fluxo**

Run: servidor dev rodando; `for i in 1 2 3 4 5 6 7; do curl -s -o /dev/null -w "%{http_code} " -X POST localhost:3000/api/admin/login -H "content-type: application/json" -d '{"password":"errada"}'; done`
Expected: `401 401 401 401 401 429 429`.

- [ ] **Step 7: Commit**

```bash
git add lib/ratelimit.ts lib/__tests__/ratelimit.test.ts app/api/admin/login/route.ts
git commit -m "feat: rate limit admin login (5 tentativas/10min por IP)"
```

---

### Task 3: Client server-side do Supabase Storage

**Files:**
- Create: `lib/supabase.ts`
- Test: `lib/__tests__/supabase.test.ts`
- Modify: `package.json` (dependência)

**Interfaces:**
- Consumes: env `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (já presentes no `.env` local).
- Produces (usado pela Task 4):
  - `export const BUCKET_NAME = "produtos"`
  - `export const MEDIA_PREFIX = "media/"`
  - `export function mediaPublicUrl(filename: string): string` — retorna URL pública absoluta do objeto `media/<filename>`.
  - `export function getSupabaseAdmin(): SupabaseClient` — lança `Error` descritivo se env faltando.

- [ ] **Step 1: Instalar dependência**

```bash
npm install @supabase/supabase-js@2
```

- [ ] **Step 2: Escrever o teste falhando** (`lib/__tests__/supabase.test.ts`)

```ts
import { getSupabaseAdmin, BUCKET_NAME, MEDIA_PREFIX, mediaPublicUrl } from "../supabase";

describe("supabase", () => {
  const ORIG_URL = process.env.SUPABASE_URL;
  const ORIG_KEY = process.env.SUPABASE_SECRET_KEY;

  afterEach(() => {
    if (ORIG_URL) process.env.SUPABASE_URL = ORIG_URL;
    if (ORIG_KEY) process.env.SUPABASE_SECRET_KEY = ORIG_KEY;
  });

  it("creates a client when env is present", () => {
    process.env.SUPABASE_URL = "https://xyz.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "service-key";
    expect(getSupabaseAdmin().storage).toBeDefined();
  });

  it("throws a descriptive error when env is missing", () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => getSupabaseAdmin()).toThrow(/SUPABASE/);
    if (prevUrl) process.env.SUPABASE_URL = prevUrl;
    if (prevKey) process.env.SUPABASE_SECRET_KEY = prevKey;
  });

  it("builds public media URL", () => {
    process.env.SUPABASE_URL = "https://xyz.supabase.co";
    expect(BUCKET_NAME).toBe("produtos");
    expect(MEDIA_PREFIX).toBe("media/");
    expect(mediaPublicUrl("abc.jpg")).toBe(
      "https://xyz.supabase.co/storage/v1/object/public/produtos/media/abc.jpg",
    );
  });
});
```

- [ ] **Step 3: Rodar teste para ver falhar**

Run: `npm test -- supabase`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar** (`lib/supabase.ts`)

```ts
// lib/supabase.ts
// Server-only: usa a service key; NUNCA importar em código client-side.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_NAME = "produtos";
export const MEDIA_PREFIX = "media/";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY are required for storage access.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function mediaPublicUrl(filename: string): string {
  const url = process.env.SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${BUCKET_NAME}/${MEDIA_PREFIX}${filename}`;
}
```

- [ ] **Step 5: Rodar teste para ver passar**

Run: `npm test -- supabase`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/supabase.ts lib/__tests__/supabase.test.ts
git commit -m "feat: add server-side supabase storage client (bucket produtos, prefix media)"
```

---

### Task 4: Upload de fotos no Supabase Storage (extrair helpers + reescrever route)

**Files:**
- Create: `lib/upload-validators.ts` (lógica pura extraída da route)
- Modify: `app/api/admin/upload/route.ts`
- Test: `lib/__tests__/upload-validators.test.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin`, `BUCKET_NAME`, `MEDIA_PREFIX`, `mediaPublicUrl` (Task 3).
- Produces: route `POST /api/admin/upload` mantém o contrato `{ ok: true, url }` / `{ ok: false }`, mas `url` passa a ser URL pública absoluta do Storage. `ProductForm` e admin continuam funcionando sem alteração.
- `lib/upload-validators.ts` exporta:
  - `ALLOWED_EXTENSIONS: string[]`
  - `MAX_FILE_SIZE: number` (= 5 * 1024 * 1024)
  - `matchesMagic(bytes: Buffer, ext: string): boolean` (baseado na tabela de magic bytes que hoje vive inline na route)
  - `buildUniqueFilename(ext: string, salt?: string): string` — `<Date.now()>-<salt aleatório de 6 chars><ext>`; `salt` opcional para determinismo em teste.

- [ ] **Step 1: Escrever o teste falhando** (`lib/__tests__/upload-validators.test.ts`)

```ts
import { matchesMagic, buildUniqueFilename, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "../upload-validators";

describe("upload-validators", () => {
  it("recognizes magic bytes", () => {
    expect(matchesMagic(Buffer.from([0xff, 0xd8, 0xff, 0x00]), ".jpg")).toBe(true);
    expect(matchesMagic(Buffer.from([0x89, 0x50, 0x4e, 0x47]), ".png")).toBe(true);
    expect(matchesMagic(Buffer.from([0x00, 0x01]), ".jpg")).toBe(false);
  });

  it("limits extensions and size", () => {
    expect(ALLOWED_EXTENSIONS).toContain(".jpg");
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("builds unique filenames with extension", () => {
    expect(buildUniqueFilename(".png", "abc123")).toMatch(/^\d+-abc123\.png$/);
    expect(buildUniqueFilename(".webp")).toMatch(/^\d+-[a-z0-9]{6}\.webp$/);
  });
});
```

- [ ] **Step 2: Rodar teste para ver falhar**

Run: `npm test -- upload-validators`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar helpers** (`lib/upload-validators.ts`)

```ts
// lib/upload-validators.ts (lógica pura, sem I/O — testável em Jest)
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MAGIC_BYTES: Array<[number[], string[]]> = [
  [[0xff, 0xd8, 0xff], [".jpg", ".jpeg"]],
  [[0x89, 0x50, 0x4e, 0x47], [".png"]],
  [[0x47, 0x49, 0x46, 0x38], [".gif"]],
  [[0x52, 0x49, 0x46, 0x46], [".webp"]],
];

export function matchesMagic(bytes: Buffer, ext: string): boolean {
  const sig = MAGIC_BYTES.find(([, exts]) => exts.includes(ext));
  if (!sig) return false;
  if (bytes.length < sig[0].length) return false;
  return sig[0].every((b, i) => bytes[i] === b);
}

export function buildUniqueFilename(ext: string, salt?: string): string {
  const random = salt ?? Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}${ext}`;
}
```

- [ ] **Step 4: Rodar teste para ver passar**

Run: `npm test -- upload-validators`
Expected: PASS.

- [ ] **Step 5: Reescrever a route** — `app/api/admin/upload/route.ts` completo:

```ts
// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import path from "path";
import {
  getSupabaseAdmin,
  BUCKET_NAME,
  MEDIA_PREFIX,
  mediaPublicUrl,
} from "@/lib/supabase";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  matchesMagic,
  buildUniqueFilename,
} from "@/lib/upload-validators";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ ok: false }, { status: 400 });
    const ext = path.extname(file.name).toLowerCase();
    if (!file.type.startsWith("image/") || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesMagic(bytes, ext)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const filename = buildUniqueFilename(ext);
    const client = getSupabaseAdmin();
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(`${MEDIA_PREFIX}${filename}`, bytes, { contentType: file.type });
    if (error) {
      console.error("supabase upload error:", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true, url: mediaPublicUrl(filename) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

- [ ] **Step 6: Validar com build e testes**

Run: `npm run build && npm test`
Expected: OK. O teste funcional do upload com credenciais reais entra na verificação final do plano.

- [ ] **Step 7: Commit**

```bash
git add lib/upload-validators.ts lib/__tests__/upload-validators.test.ts app/api/admin/upload/route.ts
git commit -m "feat: upload product images to supabase storage (public bucket produtos)"
```

---

### Task 5: Baseline do Prisma migrate

**Files:**
- Create: `prisma/migrations/20260907000000_baseline/migration.sql`
- Modify: nenhum outro (a marcação é aplicada no `_prisma_migrations` do Supabase)
- Delete: `prisma/dev.db` (resquício do SQLite, não é mais usado)

**Interfaces:**
- Consumes: env `DATABASE_URL` (direta, 5432) e `prisma/schema.prisma` atual.
- Produces: histórico de migrations versionado em git a partir daqui; `prisma migrate status` deve mostrar tudo aplicado. Deploy de schema futuro = `prisma migrate deploy`.

- [ ] **Step 1: Gerar SQL da baseline a partir do schema**

```bash
mkdir -p prisma/migrations/20260907000000_baseline
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20260907000000_baseline/migration.sql
```

- [ ] **Step 2: Marcar como aplicada no banco (sem executar o SQL)**

```bash
npx prisma migrate resolve --applied 20260907000000_baseline
```
Expected: `Migration 20260907000000_baseline ... applied.`

- [ ] **Step 3: Conferir status e limpar resquício sqlite**

```bash
npx prisma migrate status && rm prisma/dev.db
```
Expected: `Database schema is up to date!`

- [ ] **Step 4: Commit**

```bash
git add prisma/migrations && git commit -m "chore: baseline prisma migrate (schema inicial marcado como aplicado no supabase)"
```

---

### Task 6: `.env.example`, node engines e seção de Deploy no README

**Files:**
- Modify: `.env.example`, `README.md`

**Interfaces:**
- Consumes: análise de 2026-09-07 (tabela de env vars; pooler 6543; CVE já resolvido pela Task 1).
- Produces: documentação que o executor/deploy segue no painel da Vercel.

- [ ] **Step 1: Atualizar `.env.example`** — adicionar as três linhas do Supabase:

```bash
SUPABASE_URL="https://SEU-PROJETO.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
SUPABASE_SECRET_KEY="sua-service-role-key-nao-comitar"
```

- [ ] **Step 2: Adicionar seção `## Deploy na Vercel` no README.md**, com este conteúdo (adaptar título existente se necessário):

```markdown
## Deploy na Vercel

1. Importe o repositório na Vercel (framework: Next.js, sem build overrides).
2. Configure as env vars de produção:

| Env var | Como obter |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection Pooling (porta **6543**), com `?pgbouncer=true&connection_limit=1` — **não** usar a URL direta 5432 |
| `ADMIN_PASSWORD` | senha forte do painel admin |
| `SESSION_SECRET` | `openssl rand -base64 32` (obrigatório, 32+ caracteres) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Supabase → Settings → API (service role) |
| `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_HOURS`, `NEXT_PUBLIC_SITE_NAME` | config pública do site (prefix NEXT_PUBLIC é inlined no build — configure antes do primeiro deploy) |

3. Aplique migrations (uma vez, da sua máquina, com a URL direta 5432):
   `npx prisma migrate deploy`
4. Cadastre conteúdo (produtos/oficinas e fotos) pelo painel `/admin/login`.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: vercel deploy instructions and supabase env vars"
```

---

## Verificação final do plano

- [ ] `npm run build && npm test` — tudo verde.
- [ ] `curl POST /api/admin/upload` com foto real → `{ ok: true, url: "https://...supabase..." }` e a URL abre no navegador.
- [ ] Upload pelo painel admin `/admin/produtos/novo` funciona localmente (DevTools mostra URL do Supabase).
- [ ] `npx prisma migrate status` → up to date.
- [ ] README documenta todos os env vars da Vercel.
- [ ] `git log` mostra 1 commit por task; `.env` nunca trackeado (`git ls-files | grep .env` vazio).

## Fora do escopo deste plano (pós-deploy)

- Backfill das fotos antigas de `public/uploads/` (decisão do dono: recadastrar fotos pelo admin ou migrar depois).
- Migrar `<img>` para `next/image` + otimização (requer `remotePatterns`).
- Rate limiting distribuído (Upstash) — o in-memory cobre o caso atual.
- Troca da senha `admin123` real e cadastro do conteúdo real pelo admin.
