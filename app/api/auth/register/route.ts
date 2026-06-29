/**
 * POST /api/auth/register — create an email/password account.
 * On success the client then calls signIn("credentials") to start a session.
 */
import { registerUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");
  const username = String(body?.username ?? "");
  const name = body?.name ? String(body.name) : undefined;
  try {
    const user = await registerUser(email, password, username, name);
    return Response.json(user, { status: 201 });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
