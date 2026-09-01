export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <div className="neu-raised flex flex-col items-center gap-4 px-6 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="h-10 w-10 animate-spin rounded-full border-2 border-(--color-surface-inset) border-t-(--color-accent)"
        />
        <p className="text-sm text-(--color-text-secondary)">Loading…</p>
      </div>
    </div>
  );
}