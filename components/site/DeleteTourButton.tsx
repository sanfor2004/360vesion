"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTour } from "@/lib/api-client";

export default function DeleteTourButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!confirm(`Delete "${title || "this tour"}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteTour(id);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <button style={{ color: "#f87171" }} onClick={remove} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
