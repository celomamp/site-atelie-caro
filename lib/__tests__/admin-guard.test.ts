import {
  requireAdmin,
  isSameOriginRequest,
  requireSameOrigin,
  guardAdminMutation,
} from "../admin-guard";

jest.mock("@/lib/session", () => ({ isAdmin: jest.fn() }));

const { isAdmin } = require("@/lib/session");

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/admin/produtos", {
    method: "POST",
    headers,
  });
}

describe("requireAdmin", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null for an authenticated admin", async () => {
    isAdmin.mockResolvedValue(true);
    expect(await requireAdmin()).toBeNull();
  });

  it("returns 401 for an anonymous caller", async () => {
    isAdmin.mockResolvedValue(false);
    const res = await requireAdmin();
    expect(res?.status).toBe(401);
  });
});

describe("isSameOriginRequest", () => {
  it("always allows outside of production", () => {
    expect(
      isSameOriginRequest(req({ "sec-fetch-site": "cross-site" }), "development")
    ).toBe(true);
    expect(isSameOriginRequest(req(), "test")).toBe(true);
  });

  it("rejects cross-site mutations in production", () => {
    expect(
      isSameOriginRequest(req({ "sec-fetch-site": "cross-site" }), "production")
    ).toBe(false);
  });

  it("accepts same-origin and direct navigations in production", () => {
    expect(
      isSameOriginRequest(req({ "sec-fetch-site": "same-origin" }), "production")
    ).toBe(true);
    expect(
      isSameOriginRequest(req({ "sec-fetch-site": "none" }), "production")
    ).toBe(true);
  });

  it("falls back to Origin/Host when Sec-Fetch-Site is absent", () => {
    expect(
      isSameOriginRequest(
        req({ origin: "https://atelie.com", host: "atelie.com" }),
        "production"
      )
    ).toBe(true);
    expect(
      isSameOriginRequest(
        req({ origin: "https://evil.example", host: "atelie.com" }),
        "production"
      )
    ).toBe(false);
  });

  it("rejects when neither Sec-Fetch-Site nor a valid Origin is present", () => {
    expect(isSameOriginRequest(req(), "production")).toBe(false);
    expect(
      isSameOriginRequest(req({ origin: "not-a-url", host: "atelie.com" }), "production")
    ).toBe(false);
    expect(
      isSameOriginRequest(req({ origin: "https://atelie.com" }), "production")
    ).toBe(false);
  });

  it("checks Origin for same-site requests", () => {
    expect(
      isSameOriginRequest(
        req({ "sec-fetch-site": "same-site", origin: "https://atelie.com", host: "atelie.com" }),
        "production"
      )
    ).toBe(true);
  });
});

describe("requireSameOrigin", () => {
  const env = process.env as Record<string, string | undefined>;
  const prev = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = prev;
  });

  it("returns 403 in production for a cross-site mutation", () => {
    env.NODE_ENV = "production";
    const res = requireSameOrigin(req({ "sec-fetch-site": "cross-site" }));
    expect(res?.status).toBe(403);
  });

  it("allows outside of production", () => {
    env.NODE_ENV = "test";
    expect(requireSameOrigin(req())).toBeNull();
  });
});

describe("guardAdminMutation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("blocks anonymous callers before the CSRF check", async () => {
    isAdmin.mockResolvedValue(false);
    const res = await guardAdminMutation(req());
    expect(res?.status).toBe(401);
  });

  it("allows an authenticated same-origin mutation", async () => {
    isAdmin.mockResolvedValue(true);
    expect(await guardAdminMutation(req())).toBeNull();
  });
});
