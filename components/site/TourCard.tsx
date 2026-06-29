/** A tour card for the Explore feed, profiles, and dashboard. */
import Link from "next/link";
import type { Tour } from "@/lib/types";
import styles from "./feed.module.css";

function hotspotCount(t: Tour): number {
  return t.scenes.reduce((n, s) => n + s.hotspots.length, 0);
}

export default function TourCard({
  tour,
  showByline = true,
  showBadge = false,
  actions,
}: {
  tour: Tour;
  showByline?: boolean;
  showBadge?: boolean;
  actions?: React.ReactNode;
}) {
  const href = `/tour/${tour.id}`;
  return (
    <div className={styles.card}>
      <Link href={href} className={styles.thumbLink}>
        {tour.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.thumb} src={tour.coverUrl} alt={tour.title} />
        ) : (
          <div className={styles.thumbEmpty}>no image</div>
        )}
        {showBadge && tour.visibility !== "public" && (
          <span
            className={`${styles.badge} ${
              tour.visibility === "draft" ? styles.badgeDraft : styles.badgeUnlisted
            }`}
          >
            {tour.visibility}
          </span>
        )}
      </Link>
      <div className={styles.body}>
        <div className={styles.title}>{tour.title || "Untitled tour"}</div>
        {showByline && tour.ownerUsername && (
          <Link href={`/u/${tour.ownerUsername}`} className={styles.byline}>
            <span className={styles.avatar} aria-hidden />
            <span className={styles.author}>
              {tour.ownerName || `@${tour.ownerUsername}`}
            </span>
          </Link>
        )}
        <div className={styles.meta}>
          {tour.scenes.length} scene{tour.scenes.length === 1 ? "" : "s"} ·{" "}
          {hotspotCount(tour)} hotspot{hotspotCount(tour) === 1 ? "" : "s"}
          {typeof tour.viewCount === "number" ? ` · ${tour.viewCount} views` : ""}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
