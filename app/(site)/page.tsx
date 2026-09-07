import { listPublicTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import { ActionLink, EmptyState, PageHeader } from "@/components/ui";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const recent = await listPublicTours({ take: 8 });

  return (
    <main>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Your local 360° property studio</h1>
        <p className={styles.heroDescription}>
          Build interactive property tours, add floor plans and navigation points, then preview everything from one private SQLite workspace.
        </p>
        <div className={styles.heroActions}>
          <ActionLink href="/dashboard" tone="primary">Open my work</ActionLink>
          <ActionLink href="/explore" tone="outline">Explore tours</ActionLink>
        </div>
      </section>

      <section className={styles.page} style={{ paddingTop: 24 }}>
        <PageHeader title="Recently published" actions={<ActionLink href="/explore" tone="ghost" size="sm">See all →</ActionLink>} />
        {recent.length === 0 ? (
          <EmptyState title="No published tours yet" description="Create your first local tour, then set its visibility to public when it is ready to share." action={<ActionLink href="/dashboard" tone="primary">Create a tour</ActionLink>} />
        ) : (
          <div className={styles.grid}>
            {recent.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
