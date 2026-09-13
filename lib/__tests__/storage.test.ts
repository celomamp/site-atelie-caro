import fs from "fs";
import path from "path";
import os from "os";
import { getStorage, MEDIA_PREFIX } from "../storage";

describe("local storage driver", () => {
  let tmpDir: string;
  const ORIG_DRIVER = process.env.STORAGE_DRIVER;
  const ORIG_DIR = process.env.LOCAL_UPLOAD_DIR;
  const ORIG_URL = process.env.SUPABASE_URL;
  const ORIG_KEY = process.env.SUPABASE_SECRET_KEY;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-"));
    process.env.STORAGE_DRIVER = "local";
    process.env.LOCAL_UPLOAD_DIR = tmpDir;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (ORIG_DRIVER) process.env.STORAGE_DRIVER = ORIG_DRIVER;
    else delete process.env.STORAGE_DRIVER;
    if (ORIG_DIR) process.env.LOCAL_UPLOAD_DIR = ORIG_DIR;
    else delete process.env.LOCAL_UPLOAD_DIR;
    if (ORIG_URL) process.env.SUPABASE_URL = ORIG_URL;
    if (ORIG_KEY) process.env.SUPABASE_SECRET_KEY = ORIG_KEY;
  });

  it("writes file under media/ and returns relative URL", async () => {
    const storage = getStorage();
    const bytes = Buffer.from("fake-jpeg-bytes");
    const url = await storage.upload("photo.jpg", bytes, "image/jpeg");
    expect(url).toBe(`/uploads/${MEDIA_PREFIX}photo.jpg`);
    const written = fs.readFileSync(path.join(tmpDir, MEDIA_PREFIX, "photo.jpg"));
    expect(written).toEqual(bytes);
  });

  it("creates the media directory if missing", async () => {
    fs.rmSync(path.join(tmpDir, MEDIA_PREFIX), { recursive: true, force: true });
    const storage = getStorage();
    const url = await storage.upload("a.png", Buffer.from("x"), "image/png");
    expect(url).toBe("/uploads/media/a.png");
    expect(fs.existsSync(path.join(tmpDir, "media", "a.png"))).toBe(true);
  });
});
