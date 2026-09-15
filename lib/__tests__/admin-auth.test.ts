import { verifyAdminPassword } from "../admin-auth";

describe("verifyAdminPassword", () => {
  it("accepts the exact configured password", () => {
    expect(verifyAdminPassword("s3nh4-forte", "s3nh4-forte")).toBe(true);
  });

  it("rejects a wrong password of the same length", () => {
    expect(verifyAdminPassword("s3nh4-fortx", "s3nh4-forte")).toBe(false);
  });

  it("rejects a wrong password of a different length without throwing", () => {
    expect(verifyAdminPassword("curta", "s3nh4-muito-maior")).toBe(false);
  });

  it("rejects when the submitted password is not a non-empty string", () => {
    expect(verifyAdminPassword(undefined, "s3nh4-forte")).toBe(false);
    expect(verifyAdminPassword(null, "s3nh4-forte")).toBe(false);
    expect(verifyAdminPassword(123, "s3nh4-forte")).toBe(false);
    expect(verifyAdminPassword("", "s3nh4-forte")).toBe(false);
  });

  it("rejects when ADMIN_PASSWORD is not configured", () => {
    expect(verifyAdminPassword(undefined, undefined)).toBe(false);
    expect(verifyAdminPassword("", undefined)).toBe(false);
    expect(verifyAdminPassword("", "")).toBe(false);
    expect(verifyAdminPassword("qualquer", "")).toBe(false);
  });
});
