/** Local collection endpoint: list every project or create a new one. */
import { createTour, listTours } from "@/lib/store";
import { tourInputSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await listTours());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = tourInputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { error: "invalid tour", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  return Response.json(await createTour(parsed.data), { status: 201 });
}
