// lib/ratelimit.ts
// Rate limit por janela fixa, persistido no Postgres para ser compartilhado
// entre instâncias serverless (o Map em memória só funcionava por processo).
import { prisma } from "@/lib/prisma";

export type RatelimitResult = { ok: boolean; retryAfter: number };

// IP do cliente para a chave do rate limit. Usa a primeira entrada de
// x-forwarded-for (proxy confiável) e cai para x-real-ip.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 600_000;

export async function hit(
  key: string,
  opts?: { limit?: number; windowMs?: number }
): Promise<RatelimitResult> {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const id = `${key}:${windowStart}`;

  const row = await prisma.rateLimit.upsert({
    where: { id },
    create: { id, count: 1, expiresAt },
    update: { count: { increment: 1 } },
  });

  // Limpeza best-effort das janelas já expiradas.
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });

  if (row.count > limit) {
    const retryAfter = Math.max(
      Math.ceil((expiresAt.getTime() - now) / 1000),
      1
    );
    return { ok: false, retryAfter };
  }
  return { ok: true, retryAfter: 0 };
}
