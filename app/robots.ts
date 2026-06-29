import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Allow crawlers on public surfaces; keep private/owner routes, the API and
 * raw embeds out of the index (embeds carry noindex too, but disallow saves the
 * crawl budget). The canonical /tour/:id pages are what we want indexed.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/studio", "/api/", "/embed/", "/login", "/signup"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
