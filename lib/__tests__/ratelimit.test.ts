import { hit, clientIp } from "../ratelimit";

// Fake do boundary de persistência (Postgres via Prisma): janela deslizante
// simulada em memória só durante o teste.
jest.mock("@/lib/prisma", () => {
  const rows = new Map<
    string,
    { id: string; count: number; expiresAt: Date }
  >();
  return {
    prisma: {
      rateLimit: {
        __rows: rows,
        upsert: jest.fn(
          async ({
            where,
            create,
            update,
          }: {
            where: { id: string };
            create: { id: string; count: number; expiresAt: Date };
            update: { count: { increment: number } };
          }) => {
            const existing = rows.get(where.id);
            const row = existing
              ? { ...existing, count: existing.count + update.count.increment }
              : { ...create };
            rows.set(where.id, row);
            return row;
          }
        ),
        deleteMany: jest.fn(
          async ({ where }: { where: { expiresAt: { lt: Date } } }) => {
            let count = 0;
            for (const [id, row] of rows) {
              if (row.expiresAt < where.expiresAt.lt) {
                rows.delete(id);
                count++;
              }
            }
            return { count };
          }
        ),
      },
    },
  };
});

const { prisma } = require("@/lib/prisma");

const WINDOW = { limit: 3, windowMs: 60000 };

describe("ratelimit", () => {
  beforeEach(() => prisma.rateLimit.__rows.clear());

  it("allows under the limit and blocks after", async () => {
    expect((await hit("ip1", WINDOW)).ok).toBe(true);
    expect((await hit("ip1", WINDOW)).ok).toBe(true);
    expect((await hit("ip1", WINDOW)).ok).toBe(true);
    // O contador precisa ser persistido (compartilhado entre instâncias).
    expect(prisma.rateLimit.__rows.size).toBe(1);
    const blocked = await hit("ip1", WINDOW);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("tracks keys independently", async () => {
    await hit("ip1", WINDOW);
    await hit("ip1", WINDOW);
    expect((await hit("ip2", WINDOW)).ok).toBe(true);
  });

  it("resets after the window expires", async () => {
    const short = { limit: 1, windowMs: 30 };
    await hit("k", short);
    expect((await hit("k", short)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect((await hit("k", short)).ok).toBe(true);
  });

  it("removes expired rows", async () => {
    const short = { limit: 1, windowMs: 20 };
    await hit("old", short);
    expect(prisma.rateLimit.__rows.size).toBe(1);
    await new Promise((r) => setTimeout(r, 30));
    await hit("fresh", { limit: 1, windowMs: 60000 });
    const ids = [...prisma.rateLimit.__rows.keys()];
    expect(ids.some((id) => id.startsWith("old:"))).toBe(false);
  });
});

describe("clientIp", () => {
  function req(headers: Record<string, string>) {
    return new Request("http://localhost/api/x", { headers });
  }

  it("uses the first x-forwarded-for entry", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))
    ).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("returns unknown when no ip header is present", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});
