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
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-12 overflow-hidden px-4 py-16 sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:px-16 xl:px-24">
      <AmbientField />

      <RevealOnMount>
        <div className="max-w-md lg:max-w-lg">
          <p className="eyebrow">01 - New account</p>
          <h1 className="mt-6 font-(family-name:--font-display) text-5xl italic leading-[0.95] text-(--color-text-primary) sm:text-6xl lg:text-7xl">
            Start with a <span className="text-(--color-accent-strong)">clean ledger.</span>
          </h1>
          <p className="mt-6 max-w-sm text-(--color-text-secondary)">
            Set your income, define your caps, and let HardCap hold the line - every expense
            reconciled the moment you log it.
          </p>
          <div className="hairline mt-10 hidden max-w-xs lg:block" />
        </div>
      </RevealOnMount>

      <RevealOnMount delay={0.12}>
        <div className="neu-raised w-full max-w-sm p-6 sm:p-10">
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
    </main>
  );
}