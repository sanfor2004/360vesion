"use client";

import dynamic from "next/dynamic";
import type { Tour } from "@/lib/types";

/**
 * Thin client boundary. The actual viewer (Photo Sphere Viewer + plugins) touches
 * `window`, so we load it via a client-side dynamic import with ssr:false. This
 * keeps every PSV/plugin import strictly client-side.
 */
const TourViewerInner = dynamic(() => import("./TourViewerInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "grid",
        placeItems: "center",
        color: "var(--muted, #8a94a1)",
      }}
    >
      Loading viewer…
    </div>
  ),
});

export default function TourViewer({ tour }: { tour: Tour }) {
  return <TourViewerInner tour={tour} />;
}
