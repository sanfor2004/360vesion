import { listPublicTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const tours = await listPublicTours();

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1>Explore</h1>
        <span className={styles.muted}>{tours.length} published tour{tours.length === 1 ? "" : "s"}</span>
      </div>

      {tours.length === 0 ? (
        <div className={styles.empty}>
          Nothing published yet. Be the first — create a tour and set it to public.
        </div>
      ) : (
        <div className={styles.grid}>
          {tours.map((t) => (
            <TourCard key={t.id} tour={t} />
          ))}
        </div>
      )}
    </main>
  );
}
