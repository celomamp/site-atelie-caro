// app/api/encomendas/upload/route.ts
// Upload público de imagens de referência da encomenda (até 3 por chamada).
import { NextResponse } from "next/server";
import path from "path";
import { getStorage } from "@/lib/storage";
import { hit } from "@/lib/ratelimit";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  matchesMagic,
  buildUniqueFilename,
} from "@/lib/upload-validators";
import { MAX_ENCOMENDA_IMAGES } from "@/lib/encomendas";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = hit(`encomenda-upload:${ip}`, { limit: 10, windowMs: 600000 });
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, retryAfter: rl.retryAfter },
        { status: 429 }
      );
    }
    const form = await req.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (files.length > MAX_ENCOMENDA_IMAGES) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const urls: string[] = [];
    const storage = getStorage();
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      if (!file.type.startsWith("image/") || !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ ok: false }, { status: 413 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      if (!matchesMagic(bytes, ext)) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      const filename = buildUniqueFilename(ext);
      urls.push(await storage.upload(filename, bytes, file.type));
    }
    return NextResponse.json({ ok: true, urls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
