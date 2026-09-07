"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTour } from "@/lib/api-client";
import { ActionButton, type ButtonSize, type ButtonTone } from "@/components/ui";

export default function NewTourButton({
  className,
  label = "+ New tour",
  tone,
  size,
}: {
  className?: string;
  label?: string;
  tone?: ButtonTone;
  size?: ButtonSize;
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
    <ActionButton className={className} tone={tone} size={size} onClick={create} disabled={busy}>
      {busy ? "Creating…" : label}
    </ActionButton>
  );
}
