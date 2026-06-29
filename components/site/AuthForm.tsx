"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import styles from "./forms.module.css";

export default function AuthForm({
  mode,
  googleEnabled,
  next,
}: {
  mode: "login" | "signup";
  googleEnabled: boolean;
  next: string;
}) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isSignup) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Sign-up failed");
      }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Invalid email or password.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <main className={styles.authWrap}>
      <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className={styles.sub}>
        {isSignup
          ? "Start building and publishing 360° tours."
          : "Log in to your 360Vision studio."}
      </p>

      {googleEnabled && (
        <>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => signIn("google", { callbackUrl: next })}
          >
            Continue with Google
          </button>
          <div className={styles.divider}>or</div>
        </>
      )}

      <form className={styles.form} onSubmit={submit}>
        {isSignup && (
          <>
            <label>Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jane-doe"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              minLength={3}
              maxLength={30}
              pattern="[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
              title="3–30 characters: letters, numbers and hyphens"
            />
            <span className={styles.hint}>Your public handle — your profile lives at /u/your-username</span>
            <label>Name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </>
        )}
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <label>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignup ? "at least 8 characters" : "••••••••"}
        />
        <button className={styles.primary} disabled={busy}>
          {busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </button>
        {error && <div className={styles.error}>{error}</div>}
      </form>

      <div className={styles.switch}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        )}
      </div>
    </main>
  );
}
