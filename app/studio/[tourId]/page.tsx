import { redirect } from "next/navigation";
import SphereStudio from "@/components/studio/SphereStudio";
import { getTour } from "@/lib/store";

/**
 * Local authoring studio. No account or session is required.
 */
export default async function StudioPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  const tour = await getTour(tourId);
  if (!tour) redirect("/dashboard");

  return <SphereStudio tourId={tourId} />;
}
