import { listPublicTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import { EmptyState, PageHeader } from "@/components/ui";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const tours = await listPublicTours();

  return (
    <main className={styles.page}>
      <PageHeader title="Explore" description={`${tours.length} published tour${tours.length === 1 ? "" : "s"}`} />

      {tours.length === 0 ? (
        <EmptyState title="Nothing published yet" description="Be the first to create a tour and set it to public." />
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
