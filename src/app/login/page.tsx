"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { AmbientField } from "@/components/AmbientField";

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
    <main className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <AmbientField />
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
    </main>
  );
}