/**
 * Local image storage for panorama and hotspot uploads.
 *
 * Uploaded files are written to public/uploads and served from /uploads/<key>.
 * For production systems that run multiple app instances or use ephemeral
 * filesystems, replace this implementation with durable object storage while
 * keeping the putObject signature intact.
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
