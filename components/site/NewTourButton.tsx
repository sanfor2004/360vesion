"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTour } from "@/lib/api-client";

export default function NewTourButton({
  className,
  label = "+ New tour",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const tour = await createTour({ title: "Untitled tour" });
      router.push(`/studio/${tour.id}`);
    } catch (err) {
      alert((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <button className={className} onClick={create} disabled={busy}>
      {busy ? "Creating…" : label}
    </button>
  );
}
