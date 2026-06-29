/**
 * POST /api/upload/icon  (auth-gated)
 *
 * Accepts a small image (multipart form field "file") to use as a hotspot pin.
 * Unlike /api/upload (panoramas), there is NO 2:1 requirement. The image is
 * fitted onto a transparent square and stored as PNG so markers never distort.
 */
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { putObject } from "@/lib/storage";

export const runtime = "nodejs";

const ICON_SIZE = 80; // stored at 2× the ~40px render size for retina

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return unauthorized();

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing file field" }, { status: 400 });
  }

  const input = Buffer.from(await file.arrayBuffer());

  let png: Buffer;
  try {
    png = await sharp(input)
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: "contain",
        withoutEnlargement: false,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch {
    return Response.json({ error: "unreadable image" }, { status: 422 });
  }

  try {
    const url = await putObject(`icon-${uuid()}.png`, png);
    return Response.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[upload/icon] storage failed:", err);
    return Response.json(
      { error: "Could not store the image. Configure blob storage (BLOB_READ_WRITE_TOKEN)." },
      { status: 500 }
    );
  }
}
