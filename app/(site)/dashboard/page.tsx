import { listTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import NewTourButton from "@/components/site/NewTourButton";
import DeleteTourButton from "@/components/site/DeleteTourButton";
import { ActionLink, EmptyState, PageHeader } from "@/components/ui";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tours = await listTours();

  return (
    <main className={styles.page}>
      <PageHeader eyebrow="LOCAL PROJECT LIBRARY" title="My work" description={`${tours.length} project${tours.length === 1 ? "" : "s"} saved on this device`} actions={<NewTourButton tone="primary" label="+ New tour" />} />

      {tours.length === 0 ? (
        <EmptyState title="Your local studio is ready" description="Create your first property tour, then add panoramas, navigation hotspots, and an optional floor plan." action={<NewTourButton label="Create your first 360° tour →" />} />
      ) : (
        <div className={styles.grid}>
          {tours.map((t) => (
            <TourCard
              key={t.id}
              tour={t}
              actions={
                <>
                  <ActionLink href={`/tour/${t.id}`} size="xs" tone="ghost">View</ActionLink>
                  <ActionLink href={`/studio/${t.id}`} size="xs" tone="ghost">Edit</ActionLink>
                  <DeleteTourButton id={t.id} title={t.title} />
                </>
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
