// Runs once on server boot (Next.js instrumentation hook). Self-pings
// `/api/health` every 10 minutes to stop an already-awake Render free-tier
// instance from spinning down after its 15-minute idle window. This cannot
// wake an instance that has already gone to sleep - it only prevents the
// idle timer from ever expiring while the process is running.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const selfUrl = process.env.RENDER_EXTERNAL_URL ?? process.env.SELF_URL;
  if (!selfUrl) return;

  const healthUrl = new URL("/api/health", selfUrl).toString();

  const interval = setInterval(
    () => {
      fetch(healthUrl).catch(() => {
        // Best-effort keep-alive - a failed self-ping isn't actionable here.
      });
    },
    10 * 60 * 1000,
  );
  interval.unref();
}