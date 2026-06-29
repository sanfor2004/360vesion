import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/site/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/dashboard";
  if (await getCurrentUser()) redirect(target);
  const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return <AuthForm mode="login" googleEnabled={googleEnabled} next={target} />;
}
