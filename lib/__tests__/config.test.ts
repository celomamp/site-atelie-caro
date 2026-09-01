import { SITE } from "../config";

describe("SITE config", () => {
  it("exposes whatsapp number from env", () => {
    expect(SITE.whatsapp).toBeDefined();
    expect(SITE.whatsapp).toMatch(/^\d+$/);
  });
  it("exposes site name", () => {
    expect(SITE.siteName).toBeTruthy();
  });
});
