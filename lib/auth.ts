/**
 * Local workspace identity.
 *
 * 360Vision runs as a single-owner desktop/local studio. There are no accounts,
 * passwords, cookies, or login sessions. We keep one lightweight User row only
 * because existing SQLite tour records use it as their owner relation.
 */
import { prisma } from "./prisma";

export const LOCAL_USER_ID = "local-workspace-owner";
export type SessionUser = { id: string; username: string; email: null };

/** Return the automatic owner for this local SQLite workspace. */
export async function getCurrentUser(): Promise<SessionUser> {
  const user = await prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    update: {},
    create: {
      id: LOCAL_USER_ID,
      username: "local-studio",
      name: "Local Studio",
    },
    select: { id: true, username: true },
  });
  return { id: user.id, username: user.username ?? "local-studio", email: null };
}

export async function requireUser(): Promise<SessionUser> {
  return getCurrentUser();
}
