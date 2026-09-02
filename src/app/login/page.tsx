"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { AmbientField } from "@/components/AmbientField";
import { RevealOnMount } from "@/components/RevealOnMount";

// Middleware sets a fresh CSP nonce on every request. Statically optimizing
// this page would freeze a build-time nonce into its inline scripts, which
// would never match the per-request CSP header - silently blocking
// hydration (and thus this form's onSubmit handler) on any client without a
// cache already carrying a matching bundle.
export const dynamic = "force-dynamic";

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
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-16 sm:px-6 lg:px-16 xl:px-24">
      <AmbientField />

      <div className="flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-12 lg:flex-row lg:gap-16 xl:gap-24">
        <RevealOnMount>
          <div className="max-w-md text-center lg:max-w-lg lg:text-left">
            <p className="eyebrow justify-center lg:justify-start">01 - Access</p>
            <h1 className="mt-6 font-(family-name:--font-display) text-5xl italic leading-[0.95] text-(--color-text-primary) sm:text-6xl lg:text-7xl">
              Know your <span className="text-(--color-accent-strong)">number.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-sm text-(--color-text-secondary) lg:mx-0">
              Hard spending caps, logged in seconds, tracked in real time. No drift, no spreadsheets -
              just the balance that matters.
            </p>
            <div className="hairline mx-auto mt-10 hidden max-w-xs lg:mx-0 lg:block" />
          </div>
        </RevealOnMount>

        <RevealOnMount delay={0.12}>
          <div className="neu-raised w-full max-w-sm p-6 sm:p-10 lg:max-w-xl lg:p-14">
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