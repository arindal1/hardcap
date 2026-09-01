import Link from "next/link";
import { RevealOnMount } from "@/components/RevealOnMount";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <RevealOnMount>
        <div className="neu-raised max-w-md px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="eyebrow justify-center">Error 404</p>
          <p className="mt-6 font-(family-name:--font-display) text-6xl italic text-(--color-accent-strong)">404</p>
          <div className="hairline mx-auto my-6 max-w-[8rem]" />
          <h1 className="text-xl font-medium text-(--color-text-primary)">Page not found</h1>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <Link
            href="/"
            className="neu-raised neu-pressable focus-ring mt-8 inline-block px-6 py-3 font-medium text-(--color-text-primary)"
          >
            Back to HardCap
          </Link>
        </div>
      </RevealOnMount>
    </div>
  );
}