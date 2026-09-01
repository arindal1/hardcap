"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { apiFetch } from "@/lib/api-client";

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
    <main className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <div className="neu-raised w-full max-w-sm p-6 sm:p-10">
        <h1 className="mb-8 font-(family-name:--font-display) text-3xl italic text-(--color-accent-strong)">
          HardCap
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
    </main>
  );
}