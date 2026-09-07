// lib/supabase.ts
// Server-only: usa a service key; NUNCA importar em código client-side.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_NAME = "produtos";
export const MEDIA_PREFIX = "media/";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY are required for storage access.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function mediaPublicUrl(filename: string): string {
  const url = process.env.SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${BUCKET_NAME}/${MEDIA_PREFIX}${filename}`;
}
