/**
 * GET    /api/tours/:id   — full tour JSON. Public for public/unlisted tours;
 *                           drafts are returned only to their owner.
 * PUT    /api/tours/:id   — update scenes+hotspots+metadata (owner only).
 * DELETE /api/tours/:id   — remove a tour (owner only).
 */
import { forbidden, getCurrentUser, ownsTour, unauthorized } from "@/lib/auth";
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

  if (tour.visibility === "draft") {
    const user = await getCurrentUser();
    if (!user || user.id !== tour.ownerId) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
  }
  return Response.json(tour);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsTour(user.id, id))) return forbidden();

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
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!(await ownsTour(user.id, id))) return forbidden();

  const ok = await deleteTour(id);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
