/**
 * Blob/object storage for panorama images. SEAM with two backends:
 *
 *  - **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set (the serverless
 *    filesystem is read-only/ephemeral, so local disk is not an option in
 *    production). Returns the public CDN URL.
 *  - **Local disk** (`/public/uploads`, served at `/uploads/<key>`) otherwise —
 *    convenient for local dev.
 *
 * To move to S3 / another CDN, keep `putObject`'s signature and replace the body
 * (set CORS so the viewer can load textures with crossOrigin="anonymous").
 *
 * Server-only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

/** Minimal extension → MIME map for the keys we store (.jpg / .png). */
function contentTypeFor(key: string): string | undefined {
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  return undefined;
}

/**
 * Store bytes under `key` and return the public URL to fetch them.
 * `key` must be a simple filename (no slashes / traversal).
 */
export async function putObject(key: string, data: Buffer): Promise<string> {
  if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error("invalid object key");

  // Production / serverless: persist to Vercel Blob. The package is only loaded
  // when a token is present, so local dev needs neither the token nor a network.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`uploads/${key}`, data, {
      access: "public",
      token,
      addRandomSuffix: false, // keys are already unique (uuid-based)
      allowOverwrite: true,
      contentType: contentTypeFor(key),
    });
    return url;
  }

  // Local dev: write to public/uploads and serve same-origin.
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), data);
  return `${PUBLIC_PREFIX}/${key}`;
}
