// app/api/admin/produtos/route.test.ts
import { POST } from "./route";

jest.mock("@/lib/session", () => ({ isAdmin: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: "p1",
        ...data,
      })),
    },
  },
}));

const { isAdmin } = require("@/lib/session");
const { prisma } = require("@/lib/prisma");

function req(body: unknown) {
  return new Request("http://localhost/api/admin/produtos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const valid = {
  name: "Xícara",
  slug: "xicara",
  description: "Feita à mão",
  price: 90,
};

describe("POST /api/admin/produtos", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 for anonymous callers", async () => {
    isAdmin.mockResolvedValue(false);
    const res = await POST(req(valid));
    expect(res.status).toBe(401);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("creates only whitelisted fields, ignoring extras", async () => {
    isAdmin.mockResolvedValue(true);
    const res = await POST(
      req({
        ...valid,
        id: "hack",
        createdAt: "2026-01-01",
        isAdmin: true,
        images: ["https://cdn/x.jpg"],
        categories: ["c1"],
      })
    );
    expect(res.status).toBe(201);
    const { data } = prisma.product.create.mock.calls[0][0];
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("createdAt");
    expect(data).not.toHaveProperty("isAdmin");
    expect(data.images).toBe(JSON.stringify(["https://cdn/x.jpg"]));
    expect(data.categories).toEqual({ connect: [{ id: "c1" }] });
  });

  it("rejects an invalid payload", async () => {
    isAdmin.mockResolvedValue(true);
    const res = await POST(req({ ...valid, name: "" }));
    expect(res.status).toBe(400);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });
});
