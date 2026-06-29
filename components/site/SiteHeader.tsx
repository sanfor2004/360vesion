/** Global top nav for community pages (server component). */
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import styles from "./SiteHeader.module.css";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className={styles.bar}>
      <Link href="/" className={styles.brand}>
        360<span>Vision</span>
      </Link>
      <nav className={styles.nav}>
        <Link href="/explore">Explore</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            {user.username && (
              <Link href={`/u/${user.username}`}>My profile</Link>
            )}
            <Link href="/settings/profile">Settings</Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className={styles.cta}>
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
