"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { AmbientField } from "@/components/AmbientField";
import { RevealOnMount } from "@/components/RevealOnMount";
import { apiFetch } from "@/lib/api-client";

// See src/app/login/page.tsx for why this must stay dynamic — a statically
// optimized page would bake a build-time CSP nonce into its inline scripts
// that never matches the fresh per-request nonce middleware sets, silently
// blocking hydration on any client without a cache already carrying a
// matching bundle.
export const dynamic = "force-dynamic";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) throw new Error("Account created, but sign-in failed. Try logging in.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-16 sm:px-6 lg:px-16 xl:px-24">
      <AmbientField />

      <div className="flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-12 lg:flex-row lg:gap-16 xl:gap-24">
        <RevealOnMount>
          <div className="max-w-md text-center lg:max-w-lg lg:text-left">
            <p className="eyebrow justify-center lg:justify-start">01 - New account</p>
            <h1 className="mt-6 font-(family-name:--font-display) text-5xl italic leading-[0.95] text-(--color-text-primary) sm:text-6xl lg:text-7xl">
              Start with a <span className="text-(--color-accent-strong)">clean ledger.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-sm text-(--color-text-secondary) lg:mx-0">
              Set your income, define your caps, and let HardCap hold the line - every expense
              reconciled the moment you log it.
            </p>
            <div className="hairline mx-auto mt-10 hidden max-w-xs lg:mx-0 lg:block" />
          </div>
        </RevealOnMount>

        <RevealOnMount delay={0.12}>
          <div className="neu-raised w-full max-w-sm p-6 sm:p-10 lg:max-w-xl lg:p-14">
            <p className="eyebrow">02 - Create account</p>
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
                minLength={8}
                required
              />
              {error && <p className="text-sm text-(--color-danger)">{error}</p>}
              <NeuButton type="submit" variant="accent" disabled={pending}>
                {pending ? "Creating account…" : "Create account"}
              </NeuButton>
            </form>
            <p className="mt-6 text-center text-sm text-(--color-text-muted)">
                Already have an account?{" "}
              <Link href="/login" className="text-(--color-accent)">
                Sign in
              </Link>
            </p>
          </div>
        </RevealOnMount>
      </div>

      <RevealOnMount delay={0.2}>
        <div className="mt-16 max-w-2xl text-sm text-(--color-text-muted)">
          <p className="eyebrow mb-3 justify-center">What is HardCap?</p>
          <p className="text-center">
            HardCap is a personal expense and budget tracker. Set a monthly income, split it into
            hard spending caps per category, log every expense as it happens, and see your real-time
            remaining balance - down to the rupee. Includes a lending ledger for money owed to you,
            and on-demand AI spending insights.
          </p>
        </div>
      </RevealOnMount>
    </main>
  );
}