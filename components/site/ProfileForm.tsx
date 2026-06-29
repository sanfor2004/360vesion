"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./forms.module.css";

export interface ProfileInitial {
  username: string;
  name: string;
  bio: string;
  website: string;
}

export default function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof ProfileInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setStatus("Saved.");
      router.refresh();
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={save}>
      <label>Username (your @handle)</label>
      <input value={form.username} onChange={set("username")} placeholder="jane-doe" />

      <label>Display name</label>
      <input value={form.name} onChange={set("name")} placeholder="Jane Doe" />

      <label>Bio</label>
      <textarea value={form.bio} onChange={set("bio")} placeholder="360° photographer…" rows={3} />

      <label>Website</label>
      <input value={form.website} onChange={set("website")} placeholder="https://…" />

      <button className={styles.primary} disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </button>
      {status && <div className={styles.status}>{status}</div>}
    </form>
  );
}
