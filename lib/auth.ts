/**
 * Auth seam — now backed by Auth.js (NextAuth v5).
 *
 * Providers: email/password (Credentials + bcryptjs) and Google OAuth.
 * Strategy: JWT (required for the Credentials provider). The Prisma adapter still
 * persists OAuth users/accounts; Credentials users are created via `registerUser`.
 *
 * Replaces the old shared-secret gate. Route handlers and server pages enforce
 * ownership with `requireUser()` + `ownsTour()` (there is no DB-level RLS, so we
 * check in app code).
 */
import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; username: string | null } & DefaultSession["user"];
  }
}

/** Turn an email/name into a unique @handle. */
export async function generateUsername(seed: string): Promise<string> {
  const base =
    seed
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) || "user";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.floor(Math.random() * 10000)}`;
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Self-hosted (not Vercel): trust the deployment host. Otherwise Auth.js rejects
  // requests with UntrustedHost in production.
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    // Only enable Google when credentials are configured (keeps dev working
    // without OAuth set up).
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    // Persist the user id on the token; refresh username from the DB.
    jwt: async ({ token, user }) => {
      if (user?.id) token.id = user.id;
      if (token.id) {
        const u = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true },
        });
        token.username = u?.username ?? null;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string | null) ?? null;
      }
      return session;
    },
  },
  events: {
    // Give OAuth (and any adapter-created) users an auto @handle on first sign-in.
    createUser: async ({ user }) => {
      if (!user.id) return;
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true, email: true, name: true },
      });
      if (existing && !existing.username) {
        const username = await generateUsername(
          existing.email ?? existing.name ?? "user"
        );
        await prisma.user.update({ where: { id: user.id }, data: { username } });
      }
    },
  },
});

// ---------------------------------------------------------------------------
// Helpers used by route handlers + server pages
// ---------------------------------------------------------------------------

export type SessionUser = { id: string; username: string | null; email?: string | null };

/** The signed-in user, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ? { id: session.user.id, username: session.user.username, email: session.user.email } : null;
}

/** The signed-in user, or throw a 401-style sentinel for route handlers. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** True when `userId` owns the tour `tourId`. */
export async function ownsTour(userId: string, tourId: string): Promise<boolean> {
  const t = await prisma.tour.findUnique({ where: { id: tourId }, select: { ownerId: true } });
  return !!t && t.ownerId === userId;
}

/** Create an email/password user (sign-up). Returns the new user id. */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ id: string; username: string }> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !password || password.length < 8) {
    throw new Error("Email and a password of at least 8 characters are required.");
  }
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) throw new Error("An account with that email already exists.");
  const passwordHash = await bcrypt.hash(password, 10);
  const username = await generateUsername(name || normalized);
  const user = await prisma.user.create({
    data: { email: normalized, name: name || null, passwordHash, username },
    select: { id: true, username: true },
  });
  return { id: user.id, username: user.username! };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Standard 401 response for route handlers. */
export function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

/** Standard 403 response for route handlers. */
export function forbidden(): Response {
  return Response.json({ error: "forbidden" }, { status: 403 });
}
