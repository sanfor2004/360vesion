/** A compact card for a tour in the local project library. */
import Link from "next/link";
import type { Tour } from "@/lib/types";
import styles from "./feed.module.css";

function hotspotCount(tour: Tour): number {
  return tour.scenes.reduce((total, scene) => total + scene.hotspots.length, 0);
}

function coverFor(tour: Tour): string | null {
  const scene = tour.scenes.find((item) => item.id === tour.startSceneId) ?? tour.scenes[0];
  return scene?.image.thumbnailUrl ?? scene?.image.mobileUrl ?? scene?.image.url ?? null;
}

export default function TourCard({
  tour,
  actions,
}: {
  tour: Tour;
  actions?: React.ReactNode;
}) {
  const cover = coverFor(tour);
  const hotspots = hotspotCount(tour);

  return (
    <div className={styles.card}>
      <Link href={`/tour/${tour.id}`} className={styles.thumbLink}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.thumb} src={cover} alt={tour.title} />
        ) : (
          <div className={styles.thumbEmpty}>Add your first panorama</div>
        )}
      </Link>
      <div className={styles.body}>
        <div className={styles.title}>{tour.title || "Untitled tour"}</div>
        <div className={styles.meta}>
          {tour.scenes.length} scene{tour.scenes.length === 1 ? "" : "s"} ·{" "}
          {hotspots} hotspot{hotspots === 1 ? "" : "s"}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
