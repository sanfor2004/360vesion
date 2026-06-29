import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/site/ProfileForm";
import styles from "@/components/site/feed.module.css";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/settings/profile");

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: { username: true, name: true, bio: true, website: true },
  });

  return (
    <main className={styles.page} style={{ maxWidth: 560 }}>
      <div className={styles.head}>
        <h1>Profile settings</h1>
      </div>
      <ProfileForm
        initial={{
          username: user?.username ?? "",
          name: user?.name ?? "",
          bio: user?.bio ?? "",
          website: user?.website ?? "",
        }}
      />
    </main>
  );
}
