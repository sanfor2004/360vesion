/**
 * Atomic local JSON persistence for the single-owner 360Vision studio.
 * Each tour is one portable document under data/tours.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tourSchema } from "./schema";
import type { Tour } from "./types";

const TOUR_DIRECTORY = path.join(process.cwd(), "data", "tours");
const SAFE_ID = /^[a-zA-Z0-9_-]+$/;

let writeQueue: Promise<unknown> = Promise.resolve();

function queued<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => undefined);
  return result;
}

function tourPath(id: string): string | null {
  return SAFE_ID.test(id) ? path.join(TOUR_DIRECTORY, `${id}.json`) : null;
}

async function ensureDirectory(): Promise<void> {
  await mkdir(TOUR_DIRECTORY, { recursive: true });
}

async function writeTourFile(tour: Tour): Promise<void> {
  await ensureDirectory();
  const destination = tourPath(tour.id);
  if (!destination) throw new Error("Invalid tour id");
  const temporary = `${destination}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(tour, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
}

async function readTourFile(id: string): Promise<Tour | null> {
  const filename = tourPath(id);
  if (!filename) return null;
  try {
    const raw: unknown = JSON.parse(await readFile(filename, "utf8"));
    const parsed = tourSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[store] Invalid tour data in ${filename}:`, parsed.error.issues);
      return null;
    }
    // Normalize older local files atomically without changing their timestamps.
    if (JSON.stringify(raw) !== JSON.stringify(parsed.data)) {
      await writeTourFile(parsed.data);
    }
    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[store] Could not read ${filename}:`, error);
    }
    return null;
  }
}

export async function getTour(id: string): Promise<Tour | null> {
  return readTourFile(id);
}

export async function listTours(): Promise<Tour[]> {
  await ensureDirectory();
  const names = await readdir(TOUR_DIRECTORY);
  const tours = await Promise.all(
    names.filter((name) => name.endsWith(".json")).map((name) => readTourFile(name.slice(0, -5)))
  );
  return tours
    .filter((tour): tour is Tour => Boolean(tour))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTour(input: Partial<Tour> = {}): Promise<Tour> {
  return queued(async () => {
    const now = new Date().toISOString();
    const scenes = input.scenes ?? [];
    const startSceneId = input.startSceneId ?? scenes[0]?.id ?? "";
    const tour: Tour = {
      id: randomUUID(),
      title: input.title?.trim() || "Untitled tour",
      description: input.description ?? "",
      startSceneId,
      scenes,
      floorPlan: input.floorPlan,
      createdAt: now,
      updatedAt: now,
    };
    await writeTourFile(tour);
    return tour;
  });
}

export async function saveTour(id: string, input: Partial<Tour>): Promise<Tour | null> {
  return queued(async () => {
    const existing = await readTourFile(id);
    if (!existing) return null;
    const scenes = input.scenes ?? existing.scenes;
    const tour: Tour = {
      ...existing,
      ...input,
      id: existing.id,
      title: input.title ?? existing.title,
      scenes,
      startSceneId: input.startSceneId ?? existing.startSceneId ?? scenes[0]?.id ?? "",
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await writeTourFile(tour);
    return tour;
  });
}

export async function deleteTour(id: string): Promise<boolean> {
  return queued(async () => {
    const filename = tourPath(id);
    if (!filename) return false;
    try {
      await unlink(filename);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("[store] deleteTour failed:", error);
      }
      return false;
    }
  });
}
