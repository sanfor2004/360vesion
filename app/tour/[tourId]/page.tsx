import type { Metadata } from "next";
import Link from "next/link";
import TourViewer from "@/components/viewer/TourViewer";
import { getTour } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  const tour = await getTour(tourId);
  return {
    title: tour?.title || "Tour not found",
    description: tour?.description || "A local interactive 360° tour.",
    robots: { index: false, follow: false },
  };
}

/** Local viewer. Every saved tour is available directly without publication state. */
export default async function TourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const tour = await getTour(tourId);

  if (!tour || tour.scenes.length === 0) {
    return (
      <main style={{ padding: 48, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
        <h1>Tour not found</h1>
        <p style={{ color: "var(--muted)" }}>
          This local project has no viewable scenes.
        </p>
        <p><Link href="/dashboard">Return to My work →</Link></p>
      </main>
    );
  }

  return (
    <main style={{ height: "100vh", width: "100%", position: "relative" }}>
      <TourViewer tour={tour} />
    </main>
  );
}
