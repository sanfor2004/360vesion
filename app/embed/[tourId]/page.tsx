import type { Metadata } from "next";
import Link from "next/link";
import TourViewer from "@/components/viewer/TourViewer";
import { getTour, incrementViewCount } from "@/lib/store";
import styles from "./embed.module.css";

/**
 * Embeds are never their own search result — they're framed inside other sites.
 * Keep them out of the index; the canonical /tour/:id page carries the OG data.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Minimal-chrome embeddable viewer for iframes (the distribution loop). No site
 * header; just the panorama plus a "Made with 360Vision" link back. Public and
 * unlisted tours embed for anyone; drafts never embed.
 */
export default async function EmbedPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const tour = await getTour(tourId);

  const available = tour && tour.scenes.length > 0 && tour.visibility !== "draft";

  if (!available) {
    return (
      <main className={styles.missing}>
        <p>This tour isn’t available.</p>
        <Link href="/explore" target="_blank" rel="noopener">
          360Vision →
        </Link>
      </main>
    );
  }

  // Count a view, same as the public viewer page.
  if (tour!.visibility === "public") void incrementViewCount(tour!.id);

  return (
    <main className={styles.stage}>
      <TourViewer tour={tour!} />
      <Link
        className={styles.badge}
        href={`/tour/${tour!.id}`}
        target="_blank"
        rel="noopener"
      >
        Made with{" "}
        <b>
          360<span>Vision</span>
        </b>
      </Link>
    </main>
  );
}
