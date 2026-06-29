import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { listPublicTours } from "@/lib/store";

/**
 * Static surfaces + every public tour. Runs at request time; if the DB is
 * unreachable (e.g. during a build with no database) it still returns the
 * static entries rather than failing the route.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, changeFrequency: "daily", priority: 0.9 },
  ];

  let tourEntries: MetadataRoute.Sitemap = [];
  try {
    const tours = await listPublicTours({ take: 5000 });
    tourEntries = tours.map((t) => ({
      url: `${base}/tour/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    /* DB unavailable — ship the static entries only */
  }

  return [...staticEntries, ...tourEntries];
}
