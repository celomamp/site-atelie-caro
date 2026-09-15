// app/api/shipping/quote/route.test.ts
import { POST } from "./route";

jest.mock("@/lib/ratelimit", () => ({
  hit: jest.fn(async () => ({ ok: true, retryAfter: 0 })),
  clientIp: jest.fn(() => "127.0.0.1"),
}));

function req(body: any) { return new Request("http://localhost/api/shipping/quote", { method: "POST", body: JSON.stringify(body) }) as any; }

describe("POST /api/shipping/quote", () => {
  it("returns 400 for invalid cep", async () => {
    const res = await POST(req({ cep: "abc", items: [{ slug: "x", qty: 1 }] }));
    expect(res.status).toBe(400);
  });
  it("returns 400 for empty items", async () => {
    const res = await POST(req({ cep: "13083000", items: [] }));
    expect(res.status).toBe(400);
  });
});
