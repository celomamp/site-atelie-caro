// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { getStorage } from "@/lib/storage";
import { guardAdminMutation } from "@/lib/admin-guard";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  matchesMagic,
  buildUniqueFilename,
} from "@/lib/upload-validators";

export async function POST(req: Request) {
  const denied = await guardAdminMutation(req);
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) return NextResponse.json({ ok: false }, { status: 400 });
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
    const storage = getStorage();
    const url = await storage.upload(filename, bytes, file.type);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
