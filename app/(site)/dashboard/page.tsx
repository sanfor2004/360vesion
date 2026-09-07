import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listToursByOwner } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import NewTourButton from "@/components/site/NewTourButton";
import DeleteTourButton from "@/components/site/DeleteTourButton";
import ShareButton from "@/components/site/ShareButton";
import { EmptyState, PageHeader } from "@/components/ui";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const tours = await listToursByOwner(user.id);

  return (
    <main className={styles.page}>
      <PageHeader eyebrow="LOCAL SQLITE WORKSPACE" title="My work" actions={<NewTourButton tone="primary" label="+ New tour" />} />

      {tours.length === 0 ? (
        <EmptyState title="Your local studio is ready" description="Create your first property tour, then add panoramas, navigation hotspots, and an optional floor plan." action={<NewTourButton label="Create your first 360° tour →" />} />
      ) : (
        <div className={styles.grid}>
          {tours.map((t) => (
            <TourCard
              key={t.id}
              tour={t}
              showByline={false}
              showBadge
              actions={
                <>
                  <Link href={`/tour/${t.id}`}>View</Link>
                  <Link href={`/studio/${t.id}`}>Edit</Link>
                  {t.visibility !== "draft" && (
                    <ShareButton tourId={t.id} title={t.title} variant="link" />
                  )}
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
