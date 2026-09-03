// Minimal app-shell service worker.
//
// Balance/expense data must never be served stale (see ARCHITECTURE.md
// "Balance computation" - zero drift is a primary PRD goal), so this
// deliberately never intercepts or caches anything under /api/. It only
// makes the static shell (HTML navigation fallback + built assets) available
// offline/on flaky connections; all financial data always goes to the
// network.
const CACHE_NAME = "hardcap-shell-v1";
const SHELL_URLS = ["/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls, auth, or cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Page navigations: network-first, falling back to the cached shell when
  // offline so the app still opens instead of showing the browser's offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/").then((cached) => cached ?? Response.error()))
    );
    return;
  }

  // Built static assets: cache-first, since they're content-hashed and immutable.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});