import { matchesMagic, buildUniqueFilename, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "../upload-validators";

describe("upload-validators", () => {
  it("recognizes magic bytes", () => {
    expect(matchesMagic(Buffer.from([0xff, 0xd8, 0xff, 0x00]), ".jpg")).toBe(true);
    expect(matchesMagic(Buffer.from([0x89, 0x50, 0x4e, 0x47]), ".png")).toBe(true);
    expect(matchesMagic(Buffer.from([0x00, 0x01]), ".jpg")).toBe(false);
  });

  it("limits extensions and size", () => {
    expect(ALLOWED_EXTENSIONS).toContain(".jpg");
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("builds unique filenames with extension", () => {
    expect(buildUniqueFilename(".png", "abc123")).toMatch(/^\d+-abc123\.png$/);
    expect(buildUniqueFilename(".webp")).toMatch(/^\d+-[a-z0-9]{6}\.webp$/);
  });
});
