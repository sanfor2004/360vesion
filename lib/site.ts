/**
 * The canonical public origin of this app.
 *
 * Used for absolute URLs that must work off-origin: Open Graph / Twitter image
 * tags, the sitemap, robots.txt, and any share/embed snippet generated on the
 * server. Set `NEXT_PUBLIC_SITE_URL` in production; it falls back to the Auth.js
 * host or localhost for dev.
 *
 * Client components that build share/embed snippets should prefer
 * `window.location.origin` (correct for whatever host the user is on); this
 * helper is the server-side equivalent.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Resolve a root-relative path against the canonical origin. */
export function absoluteUrl(path: string): string {
  const base = siteUrl();
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
