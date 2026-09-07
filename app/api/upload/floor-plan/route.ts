/** Upload a floor-plan image used by the interactive property navigator. */
import sharp from "sharp";
import { v4 as uuid } from "uuid";
import { putObject } from "@/lib/storage";

export const runtime = "nodejs";
const MAX_EDGE = 2400;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing file field" }, { status: 400 });
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = await sharp(input)
      .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#f6f3ee" })
      .jpeg({ quality: 88 })
      .toBuffer();
    const url = await putObject(`floor-plan-${uuid()}.jpg`, image);
    return Response.json({ url }, { status: 201 });
  } catch {
    return Response.json({ error: "unreadable floor plan image" }, { status: 422 });
  }
}
