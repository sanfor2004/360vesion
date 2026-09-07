/** Global navigation for the single-owner local studio. */
import Link from "next/link";
import NewTourButton from "./NewTourButton";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  return (
    <header className={`${styles.bar} navbar`} data-theme="luxury">
      <div className="navbar-start">
        <Link href="/dashboard" className={styles.brand} aria-label="360Vision dashboard"><img src="/brand/360vision-mark.svg" alt="360Vision" /></Link>
        <span className={styles.localBadge}>LOCAL STUDIO</span>
      </div>
      <nav className={`${styles.nav} navbar-end`}>
        <Link href="/dashboard">My work</Link>
        <Link href="/explore">Gallery</Link>
        <Link href="/demo">Demo</Link>
        <NewTourButton tone="primary" size="sm" label="+ New tour" />
      </nav>
    </header>
  );
}
