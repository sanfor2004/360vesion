/** PUT /api/profile — update the signed-in user's public profile. */
import { z } from "zod";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "lowercase letters, numbers, hyphens"),
  name: z.string().max(60).optional().or(z.literal("")),
  bio: z.string().max(400).optional().or(z.literal("")),
  website: z.string().url().max(200).optional().or(z.literal("")),
});

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "invalid" }, { status: 422 });
  }
  const { username, name, bio, website } = parsed.data;

  // Username must be unique; we normalize to lowercase via the regex above so
  // uniqueness doesn't depend on the DB collation's case sensitivity.
  const clash = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (clash && clash.id !== user.id) {
    return Response.json({ error: "That username is taken." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      name: name || null,
      bio: bio || null,
      website: website || null,
    },
  });
  return Response.json({ ok: true, username });
}
