/**
 * Typed fetch wrappers used by the studio + dashboard (client-side). Auth is the
 * Auth.js session cookie (sent automatically on same-origin requests) — no bearer
 * token. The viewer reads public tours with a plain fetch.
 */
import type { Tour, UploadResult } from "./types";

export async function fetchTour(id: string): Promise<Tour | null> {
  const res = await fetch(`/api/tours/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET tour failed: ${res.status}`);
  return res.json();
}

/** Create a new (draft) tour and return it (with its server-assigned id). */
export async function createTour(input: Partial<Tour> = {}): Promise<Tour> {
  const res = await fetch("/api/tours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "create tour"));
  return res.json();
}

export async function saveTour(id: string, tour: Tour): Promise<Tour> {
  const res = await fetch(`/api/tours/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tour),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "save tour"));
  return res.json();
}

export async function deleteTour(id: string): Promise<void> {
  const res = await fetch(`/api/tours/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await errorMessage(res, "delete tour"));
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: form, // do NOT set Content-Type; browser sets the multipart boundary
  });
  if (!res.ok) throw new Error(await errorMessage(res, "upload"));
  return res.json();
}

/** Upload a custom hotspot pin image. Returns the stored icon URL. */
export async function uploadIcon(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/icon", { method: "POST", body: form });
  if (!res.ok) throw new Error(await errorMessage(res, "icon upload"));
  return res.json();
}

async function errorMessage(res: Response, action: string): Promise<string> {
  try {
    const body = await res.json();
    return `${action} failed (${res.status}): ${body.error ?? "unknown"}`;
  } catch {
    return `${action} failed (${res.status})`;
  }
}
