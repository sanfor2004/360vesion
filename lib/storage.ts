/**
 * Blob/object storage for panorama images. SEAM: this implementation writes to
 * /public/uploads and serves from the same origin at /uploads/<key>. To move to
 * S3 / Vercel Blob / a CDN later, keep `putObject`'s signature and replace the
 * body — remember to set CORS headers there and load textures with crossOrigin.
 *
 * Server-only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

/**
 * Store bytes under `key` and return the public URL to fetch them.
 * `key` must be a simple filename (no slashes / traversal).
 */
export async function putObject(key: string, data: Buffer): Promise<string> {
  if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error("invalid object key");
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), data);
  return `${PUBLIC_PREFIX}/${key}`;
}
