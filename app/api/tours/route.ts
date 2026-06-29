/**
 * POST /api/tours  (auth) — create a tour owned by the signed-in user.
 * GET  /api/tours          — list PUBLIC tours (the Explore feed).
 */
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { createTour, listPublicTours } from "@/lib/store";
import { tourInputSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function GET() {
  const tours = await listPublicTours();
  return Response.json(tours);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = tourInputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return Response.json(
      { error: "invalid tour", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const tour = await createTour(user.id, parsed.data);
  return Response.json(tour, { status: 201 });
}
