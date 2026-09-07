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
