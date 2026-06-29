/**
 * Prisma client singleton. Next.js dev hot-reload would otherwise create a new
 * client (and a new connection pool) on every reload, exhausting connections.
 * Server-only — never import from a client component.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
