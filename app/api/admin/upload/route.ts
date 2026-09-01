// app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MAGIC_BYTES: Array<[number[], string[]]> = [
  [[0xff, 0xd8, 0xff], [".jpg", ".jpeg"]],
  [[0x89, 0x50, 0x4e, 0x47], [".png"]],
  [[0x47, 0x49, 0x46, 0x38], [".gif"]],
  [[0x52, 0x49, 0x46, 0x46], [".webp"]],
];

function matchesMagic(bytes: Buffer, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((b, i) => bytes[i] === b);
}

export async function POST(req: Request) {
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
    const magic = MAGIC_BYTES.find(([, exts]) => exts.includes(ext));
    if (magic && !matchesMagic(bytes, magic[0])) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `${Date.now()}-${random}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
