import type { Metadata } from "next";
import Link from "next/link";
import TourViewer from "@/components/viewer/TourViewer";
import ShareButton from "@/components/site/ShareButton";
import { getCurrentUser } from "@/lib/auth";
import { getTour, incrementViewCount } from "@/lib/store";

/** Best cover image for OG/Twitter cards. */
function coverFor(tour: NonNullable<Awaited<ReturnType<typeof getTour>>>): string | undefined {
  const s = tour.scenes.find((x) => x.id === tour.startSceneId) ?? tour.scenes[0];
  return (
    tour.coverUrl ??
    s?.image.thumbnailUrl ??
    s?.image.mobileUrl ??
    s?.image.url ??
    undefined
  );
}

/**
 * Per-tour Open Graph / Twitter metadata so shared links render a rich preview
 * and public tours are Google-findable. Drafts/unlisted tours are marked
 * noindex (they shouldn't appear in search even if their description leaks).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  const tour = await getTour(tourId);

  if (!tour || tour.scenes.length === 0) {
    return { title: "Tour not found", robots: { index: false, follow: false } };
  }

  const title = tour.title || "Untitled tour";
  const by = tour.ownerName || (tour.ownerUsername ? `@${tour.ownerUsername}` : null);
  const description =
    tour.description ||
    `An interactive 360° tour${by ? ` by ${by}` : ""} on 360Vision.`;
  const cover = coverFor(tour);
  const url = `/tour/${tour.id}`;
  const isPublic = tour.visibility === "public";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isPublic ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: cover ? [{ url: cover, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

/**
 * Public viewer page. Public/unlisted tours are visible to anyone; drafts only to
 * their owner. Bumps the view counter for non-owner public views.
 */
export default async function TourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const tour = await getTour(tourId);

  const notFound = !tour || tour.scenes.length === 0;
  let forbidden = false;
  if (tour && tour.visibility === "draft") {
    const user = await getCurrentUser();
    forbidden = !user || user.id !== tour.ownerId;
  }

  if (notFound || forbidden) {
    return (
      <main style={{ padding: 48, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
        <h1>Tour not found</h1>
        <p style={{ color: "var(--muted)" }}>
          No public tour named <code>{tourId}</code> is available.
        </p>
        <p>
          <Link href="/explore">Browse the Explore feed →</Link>
        </p>
      </main>
    );
  }

  // Count a view (non-blocking-ish; ignore failures).
  if (tour!.visibility === "public") void incrementViewCount(tour!.id);

  // Drafts are owner-only (gated above); don't surface a public share link for them.
  const shareable = tour!.visibility !== "draft";

  return (
    <main style={{ height: "100vh", width: "100%", position: "relative" }}>
      <TourViewer tour={tour!} />
      {shareable && <ShareButton tourId={tour!.id} title={tour!.title} />}
    </main>
  );
}
