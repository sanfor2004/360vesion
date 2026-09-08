"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteTour } from "@/lib/api-client";
import { ActionButton } from "@/components/ui";

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
    <ActionButton tone="error" size="xs" onClick={remove} disabled={busy}>
      {busy ? "Deleting…" : "Delete"}
    </ActionButton>
  );
}
