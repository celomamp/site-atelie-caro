// lib/upload-validators.ts (lógica pura, sem I/O — testável em Jest)
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MAGIC_BYTES: Array<[number[], string[]]> = [
  [[0xff, 0xd8, 0xff], [".jpg", ".jpeg"]],
  [[0x89, 0x50, 0x4e, 0x47], [".png"]],
  [[0x47, 0x49, 0x46, 0x38], [".gif"]],
  [[0x52, 0x49, 0x46, 0x46], [".webp"]],
];

export function matchesMagic(bytes: Buffer, ext: string): boolean {
  const sig = MAGIC_BYTES.find(([, exts]) => exts.includes(ext));
  if (!sig) return false;
  if (bytes.length < sig[0].length) return false;
  return sig[0].every((b, i) => bytes[i] === b);
}

export function buildUniqueFilename(ext: string, salt?: string): string {
  const random = salt ?? Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${random}${ext}`;
}
