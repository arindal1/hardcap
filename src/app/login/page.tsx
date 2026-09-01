"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { AmbientField } from "@/components/AmbientField";
import { RevealOnMount } from "@/components/RevealOnMount";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-12 overflow-hidden px-4 py-16 sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-16 xl:px-24">
      <AmbientField />

      <RevealOnMount>
        <div className="max-w-md lg:max-w-lg">
          <p className="eyebrow">01 - Access</p>
          <h1 className="mt-6 font-(family-name:--font-display) text-5xl italic leading-[0.95] text-(--color-text-primary) sm:text-6xl lg:text-7xl">
            Know your <span className="text-(--color-accent-strong)">number.</span>
          </h1>
          <p className="mt-6 max-w-sm text-(--color-text-secondary)">
            Hard spending caps, logged in seconds, tracked in real time. No drift, no spreadsheets -
            just the balance that matters.
          </p>
          <div className="hairline mt-10 hidden max-w-xs lg:block" />
        </div>
      </RevealOnMount>

      <RevealOnMount delay={0.12}>
        <div className="neu-raised w-full max-w-sm p-6 sm:p-10">
          <p className="eyebrow">02 - Sign in</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <NeuInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <NeuInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-(--color-danger)">{error}</p>}
            <NeuButton type="submit" variant="accent" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </NeuButton>
          </form>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="neu-raised neu-pressable focus-ring mt-4 w-full px-6 py-3 text-(--color-text-secondary)"
          >
            Continue with Google
          </button>
          <p className="mt-6 text-center text-sm text-(--color-text-muted)">
            No account?{" "}
            <Link href="/signup" className="text-(--color-accent)">
              Sign up
            </Link>
          </p>
        </div>
      </RevealOnMount>
    </main>
  );
}