/**
 * Local CRUD for one SQLite workspace. There is intentionally no account gate.
 */
import { deleteTour, getTour, saveTour } from "@/lib/store";
import { tourInputSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = await getTour(id);
  if (!tour) return Response.json({ error: "not found" }, { status: 404 });

  return Response.json(tour);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = tourInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid tour", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const tour = await saveTour(id, parsed.data);
  if (!tour) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(tour);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteTour(id);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
