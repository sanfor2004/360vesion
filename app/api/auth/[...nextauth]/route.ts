/** Auth.js (NextAuth v5) route handler — handles sign-in/out, OAuth callbacks. */
import { handlers } from "@/lib/auth";

export const runtime = "nodejs";
export const { GET, POST } = handlers;
