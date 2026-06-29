import { notFound } from "next/navigation";
import { getProfileWithTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getProfileWithTours(username);
  if (!data) notFound();
  const { user, tours } = data;

  return (
    <main className={styles.page}>
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.image || "/avatar-placeholder.svg"}
          alt={user.username}
          width={72}
          height={72}
          style={{ borderRadius: "50%", objectFit: "cover", background: "var(--line)" }}
        />
        <div>
          <h1 style={{ margin: "0 0 2px" }}>{user.name || `@${user.username}`}</h1>
          <div className={styles.muted}>@{user.username}</div>
          {user.bio && <p style={{ margin: "8px 0 0", maxWidth: 560 }}>{user.bio}</p>}
          {user.website && (
            <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14 }}>
              {user.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <div className={styles.head}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          Tours <span className={styles.muted}>· {tours.length}</span>
        </h2>
      </div>

      {tours.length === 0 ? (
        <div className={styles.empty}>No public tours yet.</div>
      ) : (
        <div className={styles.grid}>
          {tours.map((t) => (
            <TourCard key={t.id} tour={t} showByline={false} />
          ))}
        </div>
      )}
    </main>
  );
}
