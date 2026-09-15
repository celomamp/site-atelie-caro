// lib/admin-auth.ts
// Comparação timing-safe da senha do admin. Recusa quando ADMIN_PASSWORD não
// está configurado (evita o bypass `undefined === undefined`) e quando a
// entrada não é uma string não vazia.
import { timingSafeEqual } from "crypto";

export function verifyAdminPassword(
  input: unknown,
  expected: string | undefined | null
): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  if (typeof expected !== "string" || expected.length === 0) return false;
  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
