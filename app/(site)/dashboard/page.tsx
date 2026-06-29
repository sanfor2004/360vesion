import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listToursByOwner } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import NewTourButton from "@/components/site/NewTourButton";
import DeleteTourButton from "@/components/site/DeleteTourButton";
import ShareButton from "@/components/site/ShareButton";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const tours = await listToursByOwner(user.id);

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <h1>Your tours</h1>
        <NewTourButton className={styles.muted} label="+ New tour" />
      </div>

      {tours.length === 0 ? (
        <div className={styles.empty}>
          You haven&apos;t created any tours yet.
          <div style={{ marginTop: 14 }}>
            <NewTourButton label="Create your first 360° tour →" />
          </div>
        </div>
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
