import { redirect } from "next/navigation";
import SphereStudio from "@/components/studio/SphereStudio";
import { getCurrentUser } from "@/lib/auth";
import { getTour } from "@/lib/store";

/**
 * Authoring studio — owner only. Loads the tour for `tourId`; the studio fetches
 * the full tour client-side (the session cookie authorizes draft access).
 */
export default async function StudioPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/studio/${tourId}`);

  const tour = await getTour(tourId);
  if (!tour) redirect("/dashboard");
  if (tour.ownerId !== user.id) redirect("/dashboard");

  return <SphereStudio tourId={tourId} />;
}
