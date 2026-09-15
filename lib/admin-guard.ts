// lib/admin-guard.ts
// Defesa em profundidade do backoffice. O middleware.ts já bloqueia
// /admin/* e /api/admin/*, mas cada handler revalida a sessão e a origem das
// mutações por conta própria (protege contra regressão no matcher).
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";

const unauthorized = () => NextResponse.json({ ok: false }, { status: 401 });
const forbidden = () => NextResponse.json({ ok: false }, { status: 403 });

export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return unauthorized();
}

// CSRF: em produção exige que a mutação venha da mesma origem. O header
// Sec-Fetch-Site é a fonte primária; sem ele, compara Origin com Host. Fora de
// produção libera para não travar testes locais nem ferramentas de CLI.
export function isSameOriginRequest(
  req: Request,
  nodeEnv: string | undefined
): boolean {
  if (nodeEnv !== "production") return true;

  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") return false;
  if (site === "same-origin" || site === "none") return true;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function requireSameOrigin(req: Request): NextResponse | null {
  if (isSameOriginRequest(req, process.env.NODE_ENV)) return null;
  return forbidden();
}

// Sessão de admin + origem confiável, para as rotas de mutação do backoffice.
export async function guardAdminMutation(
  req: Request
): Promise<NextResponse | null> {
  return (await requireAdmin()) ?? requireSameOrigin(req);
}
