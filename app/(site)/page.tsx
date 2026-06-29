import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listPublicTours } from "@/lib/store";
import TourCard from "@/components/site/TourCard";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, recent] = await Promise.all([getCurrentUser(), listPublicTours({ take: 8 })]);

  return (
    <main>
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 24px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 44, letterSpacing: ".02em", margin: "0 0 12px" }}>
          The first 360° online studio & community
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: 620, margin: "0 auto 28px" }}>
          Create interactive 360° panorama tours right in your browser, publish them,
          and share them with the world. Like ArtStation — for immersive 360° content.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={user ? "/dashboard" : "/signup"} style={cta}>
            {user ? "Go to your dashboard" : "Start creating — it's free"}
          </Link>
          <Link href="/explore" style={ctaGhost}>
            Explore tours
          </Link>
        </div>
      </section>

      <section className={styles.page} style={{ paddingTop: 24 }}>
        <div className={styles.head}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Recently published</h2>
          <Link href="/explore" style={{ color: "var(--teal)" }}>
            See all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className={styles.empty}>
            No public tours yet. {user ? (
              <Link href="/dashboard">Create the first one →</Link>
            ) : (
              <Link href="/signup">Sign up to publish the first one →</Link>
            )}
          </div>
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

const cta: React.CSSProperties = {
  background: "var(--teal)",
  color: "#0d0f13",
  fontWeight: 700,
  padding: "12px 22px",
  borderRadius: 10,
  textDecoration: "none",
};
const ctaGhost: React.CSSProperties = {
  border: "1px solid var(--line)",
  color: "var(--text)",
  padding: "12px 22px",
  borderRadius: 10,
  textDecoration: "none",
};
