/**
 * Tour persistence. SEAM: backed by Prisma on SQLite. The tour's scenes and
 * hotspots live in the `data` JSON string; community metadata
 * (owner/slug/visibility/cover/timestamps) lives in real columns for querying.
 *
 * Server-only.
 */
import type { Tour as TourRow } from "@prisma/client";
import { prisma } from "./prisma";
import type { Scene, Tour, Visibility } from "./types";

type OwnerSel = { username: string | null; name: string | null } | null;
type RowWithOwner = TourRow & { owner?: OwnerSel };

const ownerSelect = { select: { username: true, name: true } } as const;

/** Pick a cover image from a tour's start scene. */
function coverFrom(scenes: Scene[], startSceneId: string): string | null {
  const s = scenes.find((x) => x.id === startSceneId) ?? scenes[0];
  if (!s) return null;
  return s.image.thumbnailUrl ?? s.image.mobileUrl ?? s.image.url ?? null;
}

/** free text → safe slug. */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tour"
  );
}

/** A slug unique among this owner's tours. */
async function uniqueSlug(ownerId: string, title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const existing = await prisma.tour.findUnique({
      where: { ownerId_slug: { ownerId, slug: candidate } },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** DB row → app Tour shape (merges the JSON `data` with the columns). */
function rowToTour(row: RowWithOwner): Tour {
  let data: { startSceneId?: string; scenes?: Scene[] } = {};
  try {
    data = JSON.parse(row.data || "{}") as { startSceneId?: string; scenes?: Scene[] };
  } catch {
    data = {};
  }
  const scenes = data.scenes ?? [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility as Visibility,
    startSceneId: data.startSceneId ?? scenes[0]?.id ?? "",
    scenes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ownerId: row.ownerId,
    ownerUsername: row.owner?.username ?? null,
    ownerName: row.owner?.name ?? null,
    slug: row.slug,
    coverUrl: row.coverUrl,
    viewCount: row.viewCount,
  };
}

/** The JSON blob we store in the `data` column. */
function dataFor(input: Partial<Tour>): string {
  return JSON.stringify({
    startSceneId: input.startSceneId ?? input.scenes?.[0]?.id ?? "",
    scenes: input.scenes ?? [],
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getTour(id: string): Promise<Tour | null> {
  try {
    const row = await prisma.tour.findUnique({
      where: { id },
      include: { owner: ownerSelect },
    });
    return row ? rowToTour(row) : null;
  } catch (err) {
    // Don't 500 the viewer/page on a DB outage — treat as "not found" and log.
    console.error("[store] getTour failed:", err);
    return null;
  }
}

/** All tours (admin/debug). Prefer the scoped queries below. */
export async function listTours(): Promise<Tour[]> {
  const rows = await prisma.tour.findMany({
    orderBy: { updatedAt: "desc" },
    include: { owner: ownerSelect },
  });
  return rows.map(rowToTour);
}

/** Public Explore feed — published tours, newest first. */
export async function listPublicTours(opts?: { take?: number; cursor?: string }): Promise<Tour[]> {
  const take = opts?.take ?? 48;
  if (!process.env.DATABASE_URL) return [];

  try {
    const rows = await prisma.tour.findMany({
      where: { visibility: "public" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take,
      ...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      include: { owner: ownerSelect },
    });
    return rows.map(rowToTour);
  } catch (err) {
    // Public feed (landing/explore/sitemap) should render empty, not 500, if the
    // DB is briefly unreachable. Log the real cause for the server logs.
    console.error("[store] listPublicTours failed:", err);
    return [];
  }
}

/** A user's own tours (dashboard) — drafts included. */
export async function listToursByOwner(ownerId: string): Promise<Tour[]> {
  const rows = await prisma.tour.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: { owner: ownerSelect },
  });
  return rows.map(rowToTour);
}

/** A creator profile + their public tours (portfolio). */
export async function getProfileWithTours(username: string): Promise<{
  user: { id: string; username: string; name: string | null; image: string | null; bio: string | null; website: string | null };
  tours: Tour[];
} | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, image: true, bio: true, website: true },
    });
    if (!user?.username) return null;
    const rows = await prisma.tour.findMany({
      where: { ownerId: user.id, visibility: "public" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: { owner: ownerSelect },
    });
    return { user: { ...user, username: user.username }, tours: rows.map(rowToTour) };
  } catch (err) {
    // Degrade to "profile not found" instead of 500 on a DB outage.
    console.error("[store] getProfileWithTours failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Create a new tour owned by `ownerId`. */
export async function createTour(ownerId: string, input: Partial<Tour> = {}): Promise<Tour> {
  const title = input.title ?? "Untitled tour";
  const visibility = (input.visibility ?? "draft") as Visibility;
  const scenes = input.scenes ?? [];
  const startSceneId = input.startSceneId ?? scenes[0]?.id ?? "";
  const slug = await uniqueSlug(ownerId, title);
  const row = await prisma.tour.create({
    data: {
      ownerId,
      slug,
      title,
      description: input.description ?? "",
      visibility,
      coverUrl: input.coverUrl ?? coverFrom(scenes, startSceneId),
      data: dataFor({ ...input, scenes, startSceneId }),
      publishedAt: visibility === "public" ? new Date() : null,
    },
    include: { owner: ownerSelect },
  });
  return rowToTour(row);
}

/**
 * Update an existing tour. Caller MUST have verified ownership first
 * (see `ownsTour`). Returns null if the tour does not exist.
 */
export async function saveTour(id: string, input: Partial<Tour>): Promise<Tour | null> {
  const existing = await prisma.tour.findUnique({ where: { id } });
  if (!existing) return null;

  const visibility = (input.visibility ?? (existing.visibility as Visibility)) as Visibility;
  const title = input.title ?? existing.title;
  let existingData: { startSceneId?: string; scenes?: Scene[] } = {};
  try {
    existingData = JSON.parse(existing.data || "{}") as { startSceneId?: string; scenes?: Scene[] };
  } catch {
    existingData = {};
  }

  const scenes = input.scenes ?? existingData.scenes ?? [];
  const startSceneId =
    input.startSceneId ?? existingData.startSceneId ?? scenes[0]?.id ?? "";

  // First publish stamps publishedAt; going back to draft clears it.
  let publishedAt = existing.publishedAt;
  if (visibility === "public" && !publishedAt) publishedAt = new Date();
  if (visibility === "draft") publishedAt = null;

  const row = await prisma.tour.update({
    where: { id },
    data: {
      title,
      description: input.description ?? existing.description,
      visibility,
      coverUrl: input.coverUrl ?? coverFrom(scenes, startSceneId),
      data: dataFor({ ...input, scenes, startSceneId }),
      publishedAt,
    },
    include: { owner: ownerSelect },
  });
  return rowToTour(row);
}

export async function deleteTour(id: string): Promise<boolean> {
  try {
    await prisma.tour.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

/** Bump the public view counter (fire-and-forget from the viewer page). */
export async function incrementViewCount(id: string): Promise<void> {
  await prisma.tour.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
