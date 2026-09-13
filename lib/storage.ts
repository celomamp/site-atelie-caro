// lib/storage.ts
// Server-only: abstração de storage com drivers local (dev) e Supabase (produção).
import fs from "fs";
import path from "path";
import { getSupabaseAdmin, BUCKET_NAME, MEDIA_PREFIX } from "./supabase";

export { MEDIA_PREFIX };

export interface StorageDriver {
  upload(filename: string, bytes: Buffer, contentType: string): Promise<string>;
}

class LocalStorageDriver implements StorageDriver {
  constructor(private dir: string) {}

  async upload(filename: string, bytes: Buffer): Promise<string> {
    const targetDir = path.join(this.dir, MEDIA_PREFIX);
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(path.join(targetDir, filename), bytes);
    return `/uploads/${MEDIA_PREFIX}${filename}`;
  }
}

class SupabaseStorageDriver implements StorageDriver {
  async upload(filename: string, bytes: Buffer, contentType: string): Promise<string> {
    const client = getSupabaseAdmin();
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(`${MEDIA_PREFIX}${filename}`, bytes, { contentType });
    if (error) throw error;
    const url = process.env.SUPABASE_URL!;
    return `${url}/storage/v1/object/public/${BUCKET_NAME}/${MEDIA_PREFIX}${filename}`;
  }
}

export function getStorage(): StorageDriver {
  if (process.env.STORAGE_DRIVER === "local") {
    const dir = process.env.LOCAL_UPLOAD_DIR;
    if (!dir) {
      throw new Error("LOCAL_UPLOAD_DIR is required when STORAGE_DRIVER=local.");
    }
    return new LocalStorageDriver(dir);
  }
  return new SupabaseStorageDriver();
}
