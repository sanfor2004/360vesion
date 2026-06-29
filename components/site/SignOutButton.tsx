"use client";

import { signOut } from "next-auth/react";
import styles from "./SiteHeader.module.css";

export default function SignOutButton() {
  return (
    <button className={styles.signout} onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}
