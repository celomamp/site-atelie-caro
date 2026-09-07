import { getSupabaseAdmin, BUCKET_NAME, MEDIA_PREFIX, mediaPublicUrl } from "../supabase";

describe("supabase", () => {
  const ORIG_URL = process.env.SUPABASE_URL;
  const ORIG_KEY = process.env.SUPABASE_SECRET_KEY;

  afterEach(() => {
    if (ORIG_URL) process.env.SUPABASE_URL = ORIG_URL;
    if (ORIG_KEY) process.env.SUPABASE_SECRET_KEY = ORIG_KEY;
  });

  it("creates a client when env is present", () => {
    process.env.SUPABASE_URL = "https://xyz.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "service-key";
    expect(getSupabaseAdmin().storage).toBeDefined();
  });

  it("throws a descriptive error when env is missing", () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    expect(() => getSupabaseAdmin()).toThrow(/SUPABASE/);
    if (prevUrl) process.env.SUPABASE_URL = prevUrl;
    if (prevKey) process.env.SUPABASE_SECRET_KEY = prevKey;
  });

  it("builds public media URL", () => {
    process.env.SUPABASE_URL = "https://xyz.supabase.co";
    expect(BUCKET_NAME).toBe("produtos");
    expect(MEDIA_PREFIX).toBe("media/");
    expect(mediaPublicUrl("abc.jpg")).toBe(
      "https://xyz.supabase.co/storage/v1/object/public/produtos/media/abc.jpg",
    );
  });
});
